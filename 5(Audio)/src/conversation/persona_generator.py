"""
Multi-persona conversation generator for creating engaging news discussions.
Creates distinct AI personas with unique speaking styles and perspectives.
"""

import random
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import json

logger = logging.getLogger(__name__)


class PersonaType(Enum):
    """Types of news personas."""
    ANCHOR = "anchor"
    EXPERT = "expert"
    REPORTER = "reporter"
    ANALYST = "analyst"
    COMMENTATOR = "commentator"


@dataclass
class Persona:
    """Represents a news persona with unique characteristics."""
    name: str
    persona_type: PersonaType
    speaking_style: str
    expertise: str
    personality_traits: List[str]
    common_phrases: List[str]
    voice_characteristics: Dict[str, str]


class PersonaGenerator:
    """Generates and manages news discussion personas."""
    
    def __init__(self):
        self.personas = self._create_default_personas()
        self.conversation_templates = self._load_conversation_templates()
    
    def _create_default_personas(self) -> List[Persona]:
        """Create default set of news personas."""
        return [
            Persona(
                name="Sarah Chen",
                persona_type=PersonaType.ANCHOR,
                speaking_style="Professional, clear, and authoritative",
                expertise="General news and current events",
                personality_traits=["confident", "articulate", "balanced"],
                common_phrases=[
                    "Let's turn to our expert for more details",
                    "This is a developing story",
                    "What are the implications of this?",
                    "Thank you for that insight"
                ],
                voice_characteristics={
                    "tone": "professional",
                    "pace": "moderate",
                    "emphasis": "clear"
                }
            ),
            Persona(
                name="Dr. Michael Rodriguez",
                persona_type=PersonaType.EXPERT,
                speaking_style="Analytical, detailed, and evidence-based",
                expertise="Technology and science",
                personality_traits=["knowledgeable", "methodical", "precise"],
                common_phrases=[
                    "From a technical perspective",
                    "The data shows that",
                    "It's important to understand that",
                    "Based on my research"
                ],
                voice_characteristics={
                    "tone": "authoritative",
                    "pace": "deliberate",
                    "emphasis": "technical"
                }
            ),
            Persona(
                name="Emma Thompson",
                persona_type=PersonaType.REPORTER,
                speaking_style="Engaging, conversational, and accessible",
                expertise="Breaking news and human interest stories",
                personality_traits=["curious", "empathetic", "energetic"],
                common_phrases=[
                    "I spoke with several people who",
                    "What we're seeing here is",
                    "This really highlights the issue of",
                    "Let me share what I've learned"
                ],
                voice_characteristics={
                    "tone": "conversational",
                    "pace": "dynamic",
                    "emphasis": "engaging"
                }
            ),
            Persona(
                name="James Wilson",
                persona_type=PersonaType.ANALYST,
                speaking_style="Strategic, forward-thinking, and contextual",
                expertise="Business and economics",
                personality_traits=["strategic", "insightful", "forward-thinking"],
                common_phrases=[
                    "Looking at the broader picture",
                    "The long-term implications are",
                    "This trend suggests that",
                    "From a market perspective"
                ],
                voice_characteristics={
                    "tone": "analytical",
                    "pace": "measured",
                    "emphasis": "strategic"
                }
            ),
            Persona(
                name="Lisa Park",
                persona_type=PersonaType.COMMENTATOR,
                speaking_style="Opinionated, passionate, and thought-provoking",
                expertise="Social issues and cultural trends",
                personality_traits=["passionate", "opinionated", "provocative"],
                common_phrases=[
                    "I think what's really happening here is",
                    "This raises important questions about",
                    "We need to consider the human cost of",
                    "From my perspective"
                ],
                voice_characteristics={
                    "tone": "passionate",
                    "pace": "varied",
                    "emphasis": "opinionated"
                }
            )
        ]
    
    def _load_conversation_templates(self) -> Dict[str, List[str]]:
        """Load conversation flow templates."""
        return {
            "opening": [
                "Welcome to today's news discussion. I'm {anchor_name}, and joining me today are {expert_name} and {reporter_name}.",
                "Good evening, I'm {anchor_name}. Let's dive into today's top story with our panel of experts.",
                "I'm {anchor_name}, and today we're examining a story that's been making headlines."
            ],
            "transitions": [
                "{anchor_name}: {expert_name}, what's your take on this?",
                "{anchor_name}: {reporter_name}, you've been following this story closely. What can you tell us?",
                "{anchor_name}: Let's get some perspective from {expert_name}.",
                "{anchor_name}: {reporter_name}, what are people saying about this?",
                "{anchor_name}: {expert_name}, how significant is this development?"
            ],
            "closing": [
                "That's all the time we have for today's discussion. Thank you to our panel.",
                "We'll continue to follow this story as it develops. Thank you for joining us.",
                "This has been a fascinating discussion. We'll be back with more analysis tomorrow."
            ]
        }
    
    def select_personas(self, num_personas: int = 3) -> List[Persona]:
        """Select a subset of personas for the conversation."""
        if num_personas >= len(self.personas):
            return self.personas.copy()
        
        # Always include an anchor
        selected = [p for p in self.personas if p.persona_type == PersonaType.ANCHOR]
        
        # Add other personas randomly
        other_personas = [p for p in self.personas if p.persona_type != PersonaType.ANCHOR]
        selected.extend(random.sample(other_personas, num_personas - 1))
        
        return selected
    
    def generate_conversation_structure(self, personas: List[Persona], 
                                      summary: str) -> Dict[str, any]:
        """Generate the structure for a news conversation."""
        anchor = next(p for p in personas if p.persona_type == PersonaType.ANCHOR)
        other_personas = [p for p in personas if p.persona_type != PersonaType.ANCHOR]
        
        # Determine conversation length based on content
        content_length = len(summary.split())
        if content_length < 100:
            num_exchanges = 3
        elif content_length < 300:
            num_exchanges = 5
        else:
            num_exchanges = 7
        
        structure = {
            "personas": personas,
            "anchor": anchor,
            "participants": other_personas,
            "opening": self._generate_opening(anchor, other_personas),
            "exchanges": self._generate_exchanges(anchor, other_personas, num_exchanges),
            "closing": self._generate_closing(anchor),
            "metadata": {
                "total_personas": len(personas),
                "estimated_duration": num_exchanges * 30,  # seconds
                "content_length": content_length
            }
        }
        
        return structure
    
    def _generate_opening(self, anchor: Persona, participants: List[Persona]) -> str:
        """Generate conversation opening."""
        template = random.choice(self.conversation_templates["opening"])
        
        # Create participant names string
        participant_names = " and ".join([p.name for p in participants])
        
        opening = template.format(
            anchor_name=anchor.name,
            expert_name=participants[0].name if participants else "our expert",
            reporter_name=participants[1].name if len(participants) > 1 else "our reporter"
        )
        
        return opening
    
    def _generate_exchanges(self, anchor: Persona, participants: List[Persona], 
                           num_exchanges: int) -> List[Dict[str, str]]:
        """Generate conversation exchanges."""
        exchanges = []
        
        for i in range(num_exchanges):
            # Select speaker (alternate between anchor and participants)
            if i % 2 == 0:
                speaker = anchor
                # Use transition template
                template = random.choice(self.conversation_templates["transitions"])
                content = template.format(
                    anchor_name=anchor.name,
                    expert_name=participants[0].name if participants else "our expert",
                    reporter_name=participants[1].name if len(participants) > 1 else "our reporter"
                )
            else:
                # Select random participant
                speaker = random.choice(participants)
                content = self._generate_persona_response(speaker, i)
            
            exchanges.append({
                "speaker": speaker.name,
                "persona_type": speaker.persona_type.value,
                "content": content,
                "speaking_style": speaker.speaking_style,
                "voice_characteristics": speaker.voice_characteristics
            })
        
        return exchanges
    
    def _generate_persona_response(self, persona: Persona, exchange_index: int) -> str:
        """Generate a response based on persona characteristics."""
        # Use persona's common phrases and speaking style
        phrase = random.choice(persona.common_phrases)
        
        # Add context-specific content based on exchange index
        context_responses = [
            "This is a significant development that we need to understand better.",
            "The implications of this are far-reaching and complex.",
            "What's particularly interesting is how this affects everyday people.",
            "This raises important questions about the future direction of this issue.",
            "From what I've observed, this trend is likely to continue."
        ]
        
        response = f"{phrase} {random.choice(context_responses)}"
        return response
    
    def _generate_closing(self, anchor: Persona) -> str:
        """Generate conversation closing."""
        template = random.choice(self.conversation_templates["closing"])
        return template.format(anchor_name=anchor.name)
    
    def create_custom_persona(self, name: str, persona_type: PersonaType,
                            speaking_style: str, expertise: str,
                            personality_traits: List[str],
                            common_phrases: List[str]) -> Persona:
        """Create a custom persona."""
        persona = Persona(
            name=name,
            persona_type=persona_type,
            speaking_style=speaking_style,
            expertise=expertise,
            personality_traits=personality_traits,
            common_phrases=common_phrases,
            voice_characteristics={
                "tone": "custom",
                "pace": "moderate",
                "emphasis": "natural"
            }
        )
        
        self.personas.append(persona)
        return persona


def main():
    """Test the persona generator."""
    generator = PersonaGenerator()
    
    # Select personas
    personas = generator.select_personas(3)
    print("Selected personas:")
    for persona in personas:
        print(f"- {persona.name} ({persona.persona_type.value}): {persona.expertise}")
    
    # Generate conversation structure
    sample_summary = "Artificial intelligence is transforming healthcare with new diagnostic tools and treatment recommendations."
    structure = generator.generate_conversation_structure(personas, sample_summary)
    
    print("\nConversation Structure:")
    print(f"Opening: {structure['opening']}")
    print("\nExchanges:")
    for i, exchange in enumerate(structure['exchanges']):
        print(f"{i+1}. {exchange['speaker']}: {exchange['content']}")
    print(f"\nClosing: {structure['closing']}")


if __name__ == "__main__":
    main()
