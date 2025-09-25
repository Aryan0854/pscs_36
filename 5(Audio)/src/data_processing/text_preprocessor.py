"""
Text preprocessing module for cleaning and preparing extracted text for analysis.
Includes tokenization, sentence splitting, and content normalization.
"""

import re
import logging
from typing import List, Dict, Optional, Tuple
import nltk
import spacy
from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.stem import WordNetLemmatizer

logger = logging.getLogger(__name__)


class TextPreprocessor:
    """Handles text preprocessing and normalization for the AI pipeline."""
    
    def __init__(self, language: str = 'english'):
        self.language = language
        self.stop_words = set(stopwords.words(language))
        self.lemmatizer = WordNetLemmatizer()
        
        # Load spaCy model for advanced NLP
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model 'en_core_web_sm' not found. Install with: python -m spacy download en_core_web_sm")
            self.nlp = None
    
    def preprocess_text(self, text: str, 
                       remove_stopwords: bool = True,
                       lemmatize: bool = True,
                       min_sentence_length: int = 10,
                       max_sentence_length: int = 200) -> Dict[str, any]:
        """
        Comprehensive text preprocessing pipeline.
        
        Args:
            text: Raw text to preprocess
            remove_stopwords: Whether to remove stop words
            lemmatize: Whether to lemmatize words
            min_sentence_length: Minimum sentence length to keep
            max_sentence_length: Maximum sentence length to keep
            
        Returns:
            Dictionary containing processed text and metadata
        """
        if not text or not text.strip():
            return {
                'processed_text': '',
                'sentences': [],
                'words': [],
                'entities': [],
                'metadata': {
                    'original_length': 0,
                    'processed_length': 0,
                    'sentence_count': 0,
                    'word_count': 0
                }
            }
        
        # Step 1: Basic cleaning
        cleaned_text = self._clean_text(text)
        
        # Step 2: Sentence tokenization
        sentences = self._split_sentences(cleaned_text)
        
        # Step 3: Filter sentences by length
        filtered_sentences = self._filter_sentences(
            sentences, min_sentence_length, max_sentence_length
        )
        
        # Step 4: Word tokenization and processing
        processed_sentences = []
        all_words = []
        
        for sentence in filtered_sentences:
            words = self._process_sentence(
                sentence, remove_stopwords, lemmatize
            )
            if words:  # Only keep sentences with words after processing
                processed_sentences.append(' '.join(words))
                all_words.extend(words)
        
        # Step 5: Named entity recognition (if spaCy available)
        entities = self._extract_entities(' '.join(processed_sentences))
        
        # Step 6: Reconstruct processed text
        processed_text = ' '.join(processed_sentences)
        
        return {
            'processed_text': processed_text,
            'sentences': processed_sentences,
            'words': all_words,
            'entities': entities,
            'metadata': {
                'original_length': len(text),
                'processed_length': len(processed_text),
                'sentence_count': len(processed_sentences),
                'word_count': len(all_words),
                'entity_count': len(entities)
            }
        }
    
    def _clean_text(self, text: str) -> str:
        """Basic text cleaning operations."""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)]', '', text)
        
        # Fix common encoding issues
        text = text.replace('â€™', "'")
        text = text.replace('â€œ', '"')
        text = text.replace('â€', '"')
        text = text.replace('â€¢', '•')
        
        # Remove excessive punctuation
        text = re.sub(r'[\.]{2,}', '.', text)
        text = re.sub(r'[!]{2,}', '!', text)
        text = re.sub(r'[?]{2,}', '?', text)
        
        return text.strip()
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences using NLTK."""
        try:
            sentences = sent_tokenize(text)
            return [s.strip() for s in sentences if s.strip()]
        except Exception as e:
            logger.warning(f"Error in sentence tokenization: {str(e)}")
            # Fallback to simple sentence splitting
            sentences = re.split(r'[.!?]+', text)
            return [s.strip() for s in sentences if s.strip()]
    
    def _filter_sentences(self, sentences: List[str], 
                         min_length: int, max_length: int) -> List[str]:
        """Filter sentences by length."""
        filtered = []
        for sentence in sentences:
            word_count = len(sentence.split())
            if min_length <= word_count <= max_length:
                filtered.append(sentence)
        return filtered
    
    def _process_sentence(self, sentence: str, 
                         remove_stopwords: bool, 
                         lemmatize: bool) -> List[str]:
        """Process individual sentence: tokenize, clean, and optionally lemmatize."""
        # Tokenize
        words = word_tokenize(sentence.lower())
        
        # Remove stopwords if requested
        if remove_stopwords:
            words = [word for word in words if word not in self.stop_words]
        
        # Remove non-alphabetic tokens
        words = [word for word in words if word.isalpha()]
        
        # Lemmatize if requested
        if lemmatize:
            words = [self.lemmatizer.lemmatize(word) for word in words]
        
        return words
    
    def _extract_entities(self, text: str) -> List[Dict[str, str]]:
        """Extract named entities using spaCy."""
        entities = []
        
        if self.nlp:
            try:
                doc = self.nlp(text)
                for ent in doc.ents:
                    entities.append({
                        'text': ent.text,
                        'label': ent.label_,
                        'start': ent.start_char,
                        'end': ent.end_char
                    })
            except Exception as e:
                logger.warning(f"Error in entity extraction: {str(e)}")
        
        return entities
    
    def extract_key_phrases(self, text: str, top_k: int = 10) -> List[Tuple[str, float]]:
        """
        Extract key phrases from text using simple frequency-based approach.
        
        Args:
            text: Input text
            top_k: Number of top phrases to return
            
        Returns:
            List of (phrase, score) tuples
        """
        # Preprocess text
        processed = self.preprocess_text(text, remove_stopwords=True, lemmatize=True)
        words = processed['words']
        
        # Calculate word frequencies
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency
        sorted_phrases = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        
        return sorted_phrases[:top_k]
    
    def create_text_chunks(self, text: str, chunk_size: int = 500, 
                          overlap: int = 50) -> List[str]:
        """
        Split text into overlapping chunks for processing.
        
        Args:
            text: Input text
            chunk_size: Maximum characters per chunk
            overlap: Number of characters to overlap between chunks
            
        Returns:
            List of text chunks
        """
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            # Try to break at sentence boundary
            if end < len(text):
                # Look for sentence ending within the last 100 characters
                search_start = max(start + chunk_size - 100, start)
                sentence_end = text.rfind('.', search_start, end)
                if sentence_end > start:
                    end = sentence_end + 1
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - overlap
            if start >= len(text):
                break
        
        return chunks


def main():
    """Test the text preprocessor."""
    preprocessor = TextPreprocessor()
    
    sample_text = """
    Artificial Intelligence (AI) is transforming the way we live and work. 
    From healthcare to finance, AI applications are becoming increasingly sophisticated. 
    Machine learning algorithms can now process vast amounts of data to identify patterns 
    and make predictions with remarkable accuracy. However, with these advances come 
    important questions about ethics, privacy, and the future of human employment.
    """
    
    result = preprocessor.preprocess_text(sample_text)
    print("Processed text:", result['processed_text'])
    print("Sentences:", len(result['sentences']))
    print("Words:", len(result['words']))
    print("Entities:", result['entities'])
    
    key_phrases = preprocessor.extract_key_phrases(sample_text)
    print("Key phrases:", key_phrases)


if __name__ == "__main__":
    main()
