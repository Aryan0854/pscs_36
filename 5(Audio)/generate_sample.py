#!/usr/bin/env python3
"""
Script to generate voice samples for different personas.
Creates short audio clips demonstrating different voice characteristics.
"""

import sys
import os
from pathlib import Path

def generate_voice_sample(text_file: str, gender: str, voice_type: str, output_file: str):
    """Generate a voice sample based on gender and voice type using enhanced gTTS."""

    try:
        # Read the text
        with open(text_file, 'r', encoding='utf-8') as f:
            text = f.read().strip()

        # Ensure output directory exists
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Enhanced voice selection for natural speech
        voice_configs = {
            'calm_female': {'tld': 'co.uk', 'slow': True, 'lang': 'en'},      # British - sophisticated
            'calm_male': {'tld': 'co.in', 'slow': True, 'lang': 'en'},        # Indian - gentle
            'energetic_female': {'tld': 'com.au', 'slow': False, 'lang': 'en'}, # Australian - lively
            'energetic_male': {'tld': 'ie', 'slow': False, 'lang': 'en'},     # Irish - enthusiastic
            'authoritative_female': {'tld': 'ca', 'slow': True, 'lang': 'en'}, # Canadian - commanding
            'authoritative_male': {'tld': 'co.uk', 'slow': True, 'lang': 'en'}, # British - formal
            'engaging_female': {'tld': 'co.nz', 'slow': False, 'lang': 'en'},  # NZ - warm
            'engaging_male': {'tld': 'com', 'slow': False, 'lang': 'en'},     # American - engaging
            'professional_female': {'tld': 'us', 'slow': False, 'lang': 'en'}, # American - clear
            'professional_male': {'tld': 'ca', 'slow': False, 'lang': 'en'},  # Canadian - professional
            'warm_female': {'tld': 'co.in', 'slow': False, 'lang': 'en'},     # Indian - caring
            'warm_male': {'tld': 'co.nz', 'slow': False, 'lang': 'en'},      # NZ - friendly
            'confident_female': {'tld': 'com', 'slow': False, 'lang': 'en'}, # American - strong
            'confident_male': {'tld': 'au', 'slow': False, 'lang': 'en'},    # Australian - bold
            'friendly_female': {'tld': 'co.nz', 'slow': False, 'lang': 'en'}, # NZ - cheerful
            'friendly_male': {'tld': 'ie', 'slow': False, 'lang': 'en'},     # Irish - welcoming
            'formal_female': {'tld': 'co.uk', 'slow': True, 'lang': 'en'},   # British - proper
            'formal_male': {'tld': 'ca', 'slow': True, 'lang': 'en'},        # Canadian - distinguished
            'casual_female': {'tld': 'ie', 'slow': False, 'lang': 'en'},    # Irish - relaxed
            'casual_male': {'tld': 'au', 'slow': False, 'lang': 'en'},      # Australian - laid-back
        }

        voice_key = f"{voice_type}_{gender}"
        config = voice_configs.get(voice_key, {'tld': 'com', 'slow': False, 'lang': 'en'})

        # Generate TTS with enhanced parameters
        from gtts import gTTS

        tts = gTTS(
            text=text,
            lang=config['lang'],
            slow=config['slow'],
            tld=config['tld']
        )

        tts.save(str(output_path))

        print(f"Generated enhanced TTS voice sample: {output_file}")
        print(f"Voice: {voice_key} -> {config}")
        print(f"Text: {text[:50]}...")

        return True

    except Exception as e:
        print(f"Error generating voice sample: {str(e)}")
        return False


def main():
    """Main CLI function."""
    if len(sys.argv) != 5:
        print("Usage: python generate_sample.py <text_file> <gender> <voice_type> <output_file>")
        sys.exit(1)

    text_file = sys.argv[1]
    gender = sys.argv[2]
    voice_type = sys.argv[3]
    output_file = sys.argv[4]

    if not os.path.exists(text_file):
        print(f"Text file not found: {text_file}")
        sys.exit(1)

    success = generate_voice_sample(text_file, gender, voice_type, output_file)

    if success:
        print("Voice sample generated successfully")
        sys.exit(0)
    else:
        print("Failed to generate voice sample")
        sys.exit(1)


if __name__ == '__main__':
    main()