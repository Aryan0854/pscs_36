"""
Custom summarization model using transformer architecture.
Implements extractive and abstractive summarization capabilities.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import (
    AutoTokenizer, AutoModel, 
    BartForConditionalGeneration, BartTokenizer,
    T5ForConditionalGeneration, T5Tokenizer
)
import logging
from typing import List, Dict, Optional, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class ExtractiveSummarizer:
    """Extractive summarization using TF-IDF and sentence ranking."""
    
    def __init__(self, max_sentences: int = 5):
        self.max_sentences = max_sentences
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
    
    def summarize(self, text: str, sentences: List[str]) -> List[str]:
        """
        Extract most important sentences from text.
        
        Args:
            text: Full text content
            sentences: List of sentences from the text
            
        Returns:
            List of top sentences for summary
        """
        if len(sentences) <= self.max_sentences:
            return sentences
        
        try:
            # Create TF-IDF matrix
            tfidf_matrix = self.vectorizer.fit_transform(sentences)
            
            # Calculate sentence scores
            sentence_scores = self._calculate_sentence_scores(tfidf_matrix, sentences)
            
            # Select top sentences
            top_indices = np.argsort(sentence_scores)[-self.max_sentences:]
            top_indices = sorted(top_indices)  # Maintain original order
            
            return [sentences[i] for i in top_indices]
            
        except Exception as e:
            logger.error(f"Error in extractive summarization: {str(e)}")
            # Fallback: return first few sentences
            return sentences[:self.max_sentences]
    
    def _calculate_sentence_scores(self, tfidf_matrix, sentences: List[str]) -> np.ndarray:
        """Calculate importance scores for each sentence."""
        # TF-IDF scores
        tfidf_scores = np.array(tfidf_matrix.sum(axis=1)).flatten()
        
        # Position scores (first and last sentences get higher scores)
        position_scores = np.zeros(len(sentences))
        for i in range(len(sentences)):
            if i == 0 or i == len(sentences) - 1:
                position_scores[i] = 1.0
            else:
                position_scores[i] = 0.5
        
        # Length scores (prefer medium-length sentences)
        length_scores = np.array([len(sentence.split()) for sentence in sentences])
        length_scores = 1.0 - np.abs(length_scores - 15) / 15  # Optimal around 15 words
        length_scores = np.clip(length_scores, 0, 1)
        
        # Combine scores
        combined_scores = (
            0.5 * tfidf_scores + 
            0.3 * position_scores + 
            0.2 * length_scores
        )
        
        return combined_scores


class CustomTransformerSummarizer(nn.Module):
    """Custom transformer-based summarization model."""
    
    def __init__(self, vocab_size: int, d_model: int = 512, nhead: int = 8, 
                 num_layers: int = 6, max_length: int = 512):
        super().__init__()
        self.d_model = d_model
        self.max_length = max_length
        
        # Embedding layers
        self.embedding = nn.Embedding(vocab_size, d_model)
        self.pos_encoding = self._create_positional_encoding(max_length, d_model)
        
        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=nhead, batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers)
        
        # Classification head for sentence importance
        self.classifier = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(d_model // 2, 1),
            nn.Sigmoid()
        )
        
    def _create_positional_encoding(self, max_length: int, d_model: int) -> torch.Tensor:
        """Create positional encoding for transformer."""
        pe = torch.zeros(max_length, d_model)
        position = torch.arange(0, max_length).unsqueeze(1).float()
        
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * 
                           -(np.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        
        return pe.unsqueeze(0)
    
    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
        """Forward pass through the model."""
        batch_size, seq_len = input_ids.shape
        
        # Embeddings
        x = self.embedding(input_ids) * np.sqrt(self.d_model)
        
        # Add positional encoding
        if seq_len <= self.max_length:
            x += self.pos_encoding[:, :seq_len, :]
        
        # Transformer encoding
        encoded = self.transformer_encoder(x, src_key_padding_mask=~attention_mask.bool())
        
        # Classification for sentence importance
        scores = self.classifier(encoded).squeeze(-1)
        
        return scores


class AbstractiveSummarizer:
    """Abstractive summarization using pre-trained models."""
    
    def __init__(self, model_name: str = "facebook/bart-large-cnn"):
        self.model_name = model_name
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        try:
            if "bart" in model_name.lower():
                self.model = BartForConditionalGeneration.from_pretrained(model_name)
                self.tokenizer = BartTokenizer.from_pretrained(model_name)
            elif "t5" in model_name.lower():
                self.model = T5ForConditionalGeneration.from_pretrained(model_name)
                self.tokenizer = T5Tokenizer.from_pretrained(model_name)
            else:
                raise ValueError(f"Unsupported model: {model_name}")
            
            self.model.to(self.device)
            self.model.eval()
            
        except Exception as e:
            logger.error(f"Error loading model {model_name}: {str(e)}")
            self.model = None
            self.tokenizer = None
    
    def summarize(self, text: str, max_length: int = 150, 
                  min_length: int = 30) -> str:
        """
        Generate abstractive summary of the text.
        
        Args:
            text: Input text to summarize
            max_length: Maximum length of summary
            min_length: Minimum length of summary
            
        Returns:
            Generated summary
        """
        if not self.model or not self.tokenizer:
            logger.warning("Model not loaded, falling back to extractive summarization")
            return self._fallback_summarize(text)
        
        try:
            # Tokenize input
            inputs = self.tokenizer(
                text, 
                max_length=1024, 
                truncation=True, 
                padding=True, 
                return_tensors="pt"
            ).to(self.device)
            
            # Generate summary
            with torch.no_grad():
                summary_ids = self.model.generate(
                    inputs.input_ids,
                    max_length=max_length,
                    min_length=min_length,
                    length_penalty=2.0,
                    num_beams=4,
                    early_stopping=True,
                    force_download=False  # Suppress deprecation warning
                )
            
            # Decode summary
            summary = self.tokenizer.decode(summary_ids[0], skip_special_tokens=True)
            return summary.strip()
            
        except Exception as e:
            logger.error(f"Error in abstractive summarization: {str(e)}")
            return self._fallback_summarize(text)
    
    def _fallback_summarize(self, text: str) -> str:
        """Fallback to simple extractive summarization."""
        sentences = text.split('. ')
        if len(sentences) <= 3:
            return text
        
        # Take first, middle, and last sentences
        summary_sentences = [
            sentences[0],
            sentences[len(sentences) // 2],
            sentences[-1]
        ]
        
        return '. '.join(summary_sentences) + '.'


class HybridSummarizer:
    """Combines extractive and abstractive summarization for better results."""
    
    def __init__(self, extractive_ratio: float = 0.7):
        self.extractive_ratio = extractive_ratio
        self.extractive_summarizer = ExtractiveSummarizer()
        self.abstractive_summarizer = AbstractiveSummarizer()
    
    def summarize(self, text: str, sentences: List[str], 
                  target_length: int = 200) -> Dict[str, any]:
        """
        Generate hybrid summary combining extractive and abstractive approaches.
        
        Args:
            text: Full text content
            sentences: List of sentences from the text
            target_length: Target length of final summary
            
        Returns:
            Dictionary containing summary and metadata
        """
        # Step 1: Extractive summarization
        extractive_sentences = self.extractive_summarizer.summarize(text, sentences)
        extractive_text = ' '.join(extractive_sentences)
        
        # Step 2: Abstractive summarization on extracted text
        abstractive_summary = self.abstractive_summarizer.summarize(
            extractive_text, 
            max_length=target_length,
            min_length=target_length // 3
        )
        
        # Step 3: Combine results
        final_summary = self._combine_summaries(extractive_text, abstractive_summary)
        
        return {
            'summary': final_summary,
            'extractive_sentences': extractive_sentences,
            'abstractive_summary': abstractive_summary,
            'metadata': {
                'original_length': len(text),
                'summary_length': len(final_summary),
                'compression_ratio': len(final_summary) / len(text),
                'extractive_sentences_count': len(extractive_sentences)
            }
        }
    
    def _combine_summaries(self, extractive: str, abstractive: str) -> str:
        """Intelligently combine extractive and abstractive summaries."""
        # If abstractive is significantly shorter, use it as base
        if len(abstractive) < len(extractive) * 0.7:
            return abstractive
        
        # Otherwise, use extractive as it's more faithful to original
        return extractive


def main():
    """Test the summarization models."""
    sample_text = """
    Artificial Intelligence (AI) has become one of the most transformative technologies 
    of the 21st century. From healthcare to finance, transportation to entertainment, 
    AI is reshaping industries and changing how we live and work. Machine learning 
    algorithms can now process vast amounts of data to identify patterns and make 
    predictions with remarkable accuracy. Deep learning, a subset of machine learning, 
    has enabled breakthroughs in computer vision, natural language processing, and 
    speech recognition. However, with these advances come important questions about 
    ethics, privacy, and the future of human employment. As AI systems become more 
    sophisticated, we must ensure they are developed and deployed responsibly.
    """
    
    sentences = sample_text.split('. ')
    
    # Test extractive summarization
    extractive_summarizer = ExtractiveSummarizer(max_sentences=3)
    extractive_summary = extractive_summarizer.summarize(sample_text, sentences)
    print("Extractive Summary:", ' '.join(extractive_summary))
    
    # Test abstractive summarization
    abstractive_summarizer = AbstractiveSummarizer()
    abstractive_summary = abstractive_summarizer.summarize(sample_text)
    print("Abstractive Summary:", abstractive_summary)
    
    # Test hybrid summarization
    hybrid_summarizer = HybridSummarizer()
    hybrid_result = hybrid_summarizer.summarize(sample_text, sentences)
    print("Hybrid Summary:", hybrid_result['summary'])


if __name__ == "__main__":
    main()
