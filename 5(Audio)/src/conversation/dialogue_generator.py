"""
Advanced dialogue generation system that creates natural, engaging conversations
based on content summaries and persona characteristics.
"""

import logging
import random
from typing import List, Dict, Optional, Tuple
import re
from dataclasses import dataclass
from .persona_generator import Persona, PersonaType

logger = logging.getLogger(__name__)


@dataclass
class DialogueTurn:
    """Represents a single turn in the conversation."""
    speaker: str
    content: str
    persona_type: str
    speaking_style: str
    voice_characteristics: Dict[str, str]
    turn_type: str  # 'opening', 'response', 'question', 'transition', 'closing'


class DialogueGenerator:
    """Generates natural, engaging dialogue for news discussions."""
    
    def __init__(self):
        self.topic_templates = self._load_topic_templates()
        self.response_generators = self._create_response_generators()
        self.transition_phrases = self._load_transition_phrases()
    
    def _load_topic_templates(self) -> Dict[str, List[str]]:
        """Load topic-specific conversation templates."""
        return {
            "technology": [
                "This technological advancement represents a significant breakthrough in",
                "The implications of this technology extend far beyond",
                "What's particularly exciting about this development is",
                "This could fundamentally change how we approach"
            ],
            "healthcare": [
                "This medical breakthrough has the potential to save countless lives by",
                "The healthcare implications of this are profound because",
                "Patients will benefit from this innovation through",
                "This represents a major step forward in treating"
            ],
            "business": [
                "The economic impact of this development is significant because",
                "This will likely affect markets in several key ways",
                "From a business perspective, this creates opportunities for",
                "The financial implications are substantial, particularly for"
            ],
            "politics": [
                "This political development has far-reaching consequences for",
                "The policy implications of this decision are complex because",
                "This will likely influence public opinion on",
                "The political landscape is shifting due to"
            ],
            "environment": [
                "The environmental impact of this cannot be overstated because",
                "This development is crucial for addressing climate change through",
                "The long-term ecological benefits include",
                "This represents a significant step toward sustainability by"
            ]
        }
    
    def _create_response_generators(self) -> Dict[PersonaType, callable]:
        """Create response generators for each persona type."""
        return {
            PersonaType.ANCHOR: self._generate_anchor_response,
            PersonaType.EXPERT: self._generate_expert_response,
            PersonaType.REPORTER: self._generate_reporter_response,
            PersonaType.ANALYST: self._generate_analyst_response,
            PersonaType.COMMENTATOR: self._generate_commentator_response
        }
    
    def _load_transition_phrases(self) -> List[str]:
        """Load natural transition phrases."""
        return [
            "That's a great point, and it leads me to ask",
            "Building on what you just said",
            "I think that raises an important question about",
            "Speaking of which, I'd like to get your thoughts on",
            "That's interesting because it connects to",
            "Let me follow up on that by asking",
            "This brings up another aspect we should consider",
            "I'm curious about your perspective on"
        ]
    
    def generate_dialogue(self, summary: str, personas: List[Persona], 
                         conversation_structure: Dict) -> List[DialogueTurn]:
        """
        Generate complete dialogue based on summary and personas.
        
        Args:
            summary: Content summary to discuss
            personas: List of personas participating
            conversation_structure: Pre-generated conversation structure
            
        Returns:
            List of dialogue turns
        """
        dialogue = []
        
        # Extract key topics from summary
        topics = self._extract_topics(summary)
        
        # Generate opening
        opening_turn = self._generate_opening_turn(
            conversation_structure['opening'], 
            conversation_structure['anchor']
        )
        dialogue.append(opening_turn)
        
        # Generate main discussion
        main_dialogue = self._generate_main_discussion(
            summary, topics, personas, conversation_structure['exchanges']
        )
        dialogue.extend(main_dialogue)
        
        # Generate closing
        closing_turn = self._generate_closing_turn(
            conversation_structure['closing'],
            conversation_structure['anchor']
        )
        dialogue.append(closing_turn)
        
        return dialogue
    
    def _extract_topics(self, summary: str) -> List[str]:
        """Extract key topics from the summary."""
        # Simple keyword-based topic extraction
        topic_keywords = {
            "technology": ["AI", "artificial intelligence", "machine learning", "algorithm", "digital", "tech"],
            "healthcare": ["medical", "health", "treatment", "patient", "doctor", "hospital", "disease"],
            "business": ["market", "economy", "business", "company", "financial", "investment", "revenue"],
            "politics": ["government", "policy", "political", "election", "congress", "president", "law"],
            "environment": ["climate", "environment", "green", "sustainable", "carbon", "renewable", "pollution"]
        }
        
        summary_lower = summary.lower()
        detected_topics = []
        
        for topic, keywords in topic_keywords.items():
            if any(keyword in summary_lower for keyword in keywords):
                detected_topics.append(topic)
        
        return detected_topics if detected_topics else ["general"]
    
    def _generate_opening_turn(self, opening_text: str, anchor: Persona) -> DialogueTurn:
        """Generate opening dialogue turn."""
        return DialogueTurn(
            speaker=anchor.name,
            content=opening_text,
            persona_type=anchor.persona_type.value,
            speaking_style=anchor.speaking_style,
            voice_characteristics=anchor.voice_characteristics,
            turn_type="opening"
        )
    
    def _generate_main_discussion(self, summary: str, topics: List[str], 
                                 personas: List[Persona], 
                                 exchanges: List[Dict]) -> List[DialogueTurn]:
        """Generate the main discussion dialogue."""
        dialogue_turns = []
        
        for i, exchange in enumerate(exchanges):
            # Generate enhanced content based on summary and topics
            enhanced_content = self._enhance_exchange_content(
                exchange, summary, topics, i
            )
            
            turn = DialogueTurn(
                speaker=exchange['speaker'],
                content=enhanced_content,
                persona_type=exchange['persona_type'],
                speaking_style=exchange['speaking_style'],
                voice_characteristics=exchange['voice_characteristics'],
                turn_type=self._determine_turn_type(exchange, i)
            )
            
            dialogue_turns.append(turn)
        
        return dialogue_turns
    
    def _enhance_exchange_content(self, exchange: Dict, summary: str, 
                                 topics: List[str], exchange_index: int) -> str:
        """Enhance exchange content with topic-specific information."""
        base_content = exchange['content']
        
        # Extract key information from the summary for more relevant dialogue
        summary_sentences = summary.split('. ')
        key_sentences = [s.strip() for s in summary_sentences if len(s.strip()) > 20]
        
        # For anchor, use the base content as it's usually a question
        if exchange['persona_type'] == 'anchor':
            enhanced_content = base_content
        else:
            # For other personas, create content-specific responses
            if key_sentences:
                # Use actual content from the summary
                relevant_sentence = random.choice(key_sentences)
                
                # Create persona-specific responses based on the actual content
                if exchange['persona_type'] == 'expert':
                    enhanced_content = f"{base_content} {relevant_sentence}. The technical implications are significant."
                elif exchange['persona_type'] == 'reporter':
                    enhanced_content = f"{base_content} {relevant_sentence}. This is what people are experiencing on the ground."
                elif exchange['persona_type'] == 'analyst':
                    enhanced_content = f"{base_content} {relevant_sentence}. The long-term implications are worth considering."
                elif exchange['persona_type'] == 'commentator':
                    enhanced_content = f"{base_content} {relevant_sentence}. This raises important questions about our approach."
                else:
                    enhanced_content = f"{base_content} {relevant_sentence}."
            else:
                # Fallback to generic content
                enhanced_content = f"{base_content} This is a significant development that we need to understand better."
        
        # Add natural transitions for non-anchor speakers
        if exchange['persona_type'] != 'anchor' and exchange_index > 0:
            transition = random.choice(self.transition_phrases)
            enhanced_content = f"{transition}, {enhanced_content.lower()}"
        
        return enhanced_content
    
    def _extract_relevant_snippet(self, summary: str, topic: str) -> str:
        """Extract a relevant snippet from the summary for the given topic."""
        sentences = summary.split('. ')
        
        # Find sentences most relevant to the topic
        topic_keywords = {
            "technology": ["AI", "artificial intelligence", "machine learning", "algorithm", "digital"],
            "healthcare": ["medical", "health", "treatment", "patient", "doctor"],
            "business": ["market", "economy", "business", "company", "financial"],
            "politics": ["government", "policy", "political", "election"],
            "environment": ["climate", "environment", "green", "sustainable"]
        }
        
        if topic in topic_keywords:
            keywords = topic_keywords[topic]
            for sentence in sentences:
                if any(keyword.lower() in sentence.lower() for keyword in keywords):
                    return sentence
        
        # Fallback to first sentence
        return sentences[0] if sentences else summary[:100]
    
    def _determine_turn_type(self, exchange: Dict, index: int) -> str:
        """Determine the type of dialogue turn."""
        if exchange['persona_type'] == 'anchor':
            if '?' in exchange['content']:
                return 'question'
            else:
                return 'transition'
        else:
            return 'response'
    
    def _generate_closing_turn(self, closing_text: str, anchor: Persona) -> DialogueTurn:
        """Generate closing dialogue turn."""
        return DialogueTurn(
            speaker=anchor.name,
            content=closing_text,
            persona_type=anchor.persona_type.value,
            speaking_style=anchor.speaking_style,
            voice_characteristics=anchor.voice_characteristics,
            turn_type="closing"
        )
    
    # Persona-specific response generators
    def _generate_anchor_response(self, persona: Persona, context: str) -> str:
        """Generate anchor-specific response."""
        anchor_phrases = [
            "Let's explore this further",
            "That's an important perspective",
            "I'd like to get your thoughts on this",
            "This raises some interesting questions"
        ]
        return f"{random.choice(anchor_phrases)}. {context}"
    
    def _generate_expert_response(self, persona: Persona, context: str) -> str:
        """Generate expert-specific response."""
        expert_phrases = [
            "From a technical standpoint",
            "The research indicates that",
            "Based on the available data",
            "The evidence suggests that"
        ]
        return f"{random.choice(expert_phrases)}, {context.lower()}"
    
    def _generate_reporter_response(self, persona: Persona, context: str) -> str:
        """Generate reporter-specific response."""
        reporter_phrases = [
            "I've been speaking with people who",
            "What I'm hearing from sources is",
            "The story on the ground shows that",
            "People are telling me that"
        ]
        return f"{random.choice(reporter_phrases)} {context.lower()}"
    
    def _generate_analyst_response(self, persona: Persona, context: str) -> str:
        """Generate analyst-specific response."""
        analyst_phrases = [
            "Looking at the broader implications",
            "The long-term impact will likely be",
            "This trend suggests that",
            "From a strategic perspective"
        ]
        return f"{random.choice(analyst_phrases)}, {context.lower()}"
    
    def _generate_commentator_response(self, persona: Persona, context: str) -> str:
        """Generate commentator-specific response."""
        commentator_phrases = [
            "I think what's really happening here is",
            "This highlights a fundamental issue with",
            "We need to consider the human cost of",
            "From my perspective, this represents"
        ]
        return f"{random.choice(commentator_phrases)} {context.lower()}"
    
    def format_dialogue_for_tts(self, dialogue: List[DialogueTurn]) -> List[Dict[str, str]]:
        """Format dialogue for text-to-speech processing."""
        tts_ready = []
        
        for turn in dialogue:
            tts_ready.append({
                "speaker": turn.speaker,
                "text": turn.content,
                "voice_characteristics": turn.voice_characteristics,
                "persona_type": turn.persona_type,
                "turn_type": turn.turn_type
            })
        
        return tts_ready


def main():
    """Test the dialogue generator."""
    from .persona_generator import PersonaGenerator
    
    # Create personas and dialogue generator
    persona_gen = PersonaGenerator()
    dialogue_gen = DialogueGenerator()
    
    # Generate sample conversation
    personas = persona_gen.select_personas(3)
    sample_summary = "Artificial intelligence is revolutionizing healthcare with new diagnostic tools that can detect diseases earlier and more accurately than traditional methods."
    
    structure = persona_gen.generate_conversation_structure(personas, sample_summary)
    dialogue = dialogue_gen.generate_dialogue(sample_summary, personas, structure)
    
    print("Generated Dialogue:")
    for i, turn in enumerate(dialogue):
        print(f"\n{i+1}. {turn.speaker} ({turn.turn_type}):")
        print(f"   {turn.content}")


if __name__ == "__main__":
    main()
