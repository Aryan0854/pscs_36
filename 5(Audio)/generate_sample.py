#!/usr/bin/env python3
"""
Script to generate voice samples for different personas.
Creates short audio clips demonstrating different voice characteristics.
"""

import sys
import os
import numpy as np
import soundfile as sf
from pathlib import Path

def generate_voice_sample(text_file: str, gender: str, voice_type: str, output_file: str):
    """Generate a voice sample based on gender and voice type."""

    try:
        # Read the text
        with open(text_file, 'r', encoding='utf-8') as f:
            text = f.read().strip()

        # Basic voice characteristics based on gender and type
        if gender.lower() == 'male':
            base_freq = 85  # Lower frequency for male voices
            if voice_type == 'professional':
                pitch_variation = 0.1
                speed = 1.0
            elif voice_type == 'authoritative':
                pitch_variation = 0.15
                speed = 0.9
            elif voice_type == 'engaging':
                pitch_variation = 0.2
                speed = 1.1
            elif voice_type == 'warm':
                pitch_variation = 0.12
                speed = 0.95
            elif voice_type == 'energetic':
                pitch_variation = 0.25
                speed = 1.2
            elif voice_type == 'calm':
                pitch_variation = 0.08
                speed = 0.85
            elif voice_type == 'confident':
                pitch_variation = 0.18
                speed = 1.0
            elif voice_type == 'friendly':
                pitch_variation = 0.16
                speed = 1.05
            elif voice_type == 'formal':
                pitch_variation = 0.1
                speed = 0.9
            elif voice_type == 'casual':
                pitch_variation = 0.2
                speed = 1.1
            else:
                pitch_variation = 0.15
                speed = 1.0
        else:  # female
            base_freq = 165  # Higher frequency for female voices
            if voice_type == 'professional':
                pitch_variation = 0.12
                speed = 1.0
            elif voice_type == 'authoritative':
                pitch_variation = 0.18
                speed = 0.95
            elif voice_type == 'engaging':
                pitch_variation = 0.22
                speed = 1.1
            elif voice_type == 'warm':
                pitch_variation = 0.15
                speed = 0.98
            elif voice_type == 'energetic':
                pitch_variation = 0.28
                speed = 1.15
            elif voice_type == 'calm':
                pitch_variation = 0.1
                speed = 0.88
            elif voice_type == 'confident':
                pitch_variation = 0.2
                speed = 1.02
            elif voice_type == 'friendly':
                pitch_variation = 0.18
                speed = 1.08
            elif voice_type == 'formal':
                pitch_variation = 0.12
                speed = 0.92
            elif voice_type == 'casual':
                pitch_variation = 0.22
                speed = 1.12
            else:
                pitch_variation = 0.17
                speed = 1.0

        # Generate sample audio (simple tone for demonstration)
        sample_rate = 22050
        duration = min(len(text) * 0.1, 5.0)  # Max 5 seconds
        samples = int(duration * sample_rate)

        # Create a simple modulated tone
        t = np.linspace(0, duration, samples, False)
        frequency = base_freq * (1 + pitch_variation * np.sin(2 * np.pi * 2 * t * speed))

        # Generate audio signal
        audio_signal = 0.3 * np.sin(2 * np.pi * frequency * t)

        # Add some noise to make it sound more natural
        noise = 0.05 * np.random.normal(0, 1, samples)
        audio_signal += noise

        # Normalize
        audio_signal = audio_signal / np.max(np.abs(audio_signal))

        # Ensure output directory exists
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Save audio file
        sf.write(str(output_path), audio_signal, sample_rate)

        print(f"Generated voice sample: {output_file}")
        print(f"Gender: {gender}, Voice Type: {voice_type}")
        print(f"Duration: {duration:.1f}s, Sample Rate: {sample_rate}Hz")

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