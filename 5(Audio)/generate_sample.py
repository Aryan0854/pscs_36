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
    """Generate a voice sample based on gender and voice type using TTS."""

    try:
        # Read the text
        with open(text_file, 'r', encoding='utf-8') as f:
            text = f.read().strip()

        # Ensure output directory exists
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Use gTTS for voice samples
        try:
            from gtts import gTTS
            from pydub import AudioSegment
            import io

            # Adjust TTS parameters based on voice type
            slow = voice_type in ['calm', 'formal', 'authoritative']

            # Generate TTS audio
            tts = gTTS(text=text, lang='en', slow=slow, tld='com')

            # Save to temporary buffer
            temp_buffer = io.BytesIO()
            tts.write_to_fp(temp_buffer)
            temp_buffer.seek(0)

            # Load and process audio
            audio_segment = AudioSegment.from_mp3(temp_buffer)

            # Adjust audio based on voice characteristics
            if voice_type == 'energetic':
                # Speed up slightly
                audio_segment = audio_segment.speedup(playback_speed=1.1)
            elif voice_type == 'calm':
                # Slow down slightly
                audio_segment = audio_segment.speedup(playback_speed=0.9)

            # Export as WAV
            audio_segment.export(str(output_path), format='wav')

            print(f"Generated TTS voice sample: {output_file}")
            print(f"Gender: {gender}, Voice Type: {voice_type}")
            print(f"Text: {text[:50]}...")

            return True

        except ImportError:
            print("TTS libraries not available, falling back to simple audio generation")
            # Fallback to simple audio generation
            import numpy as np
            import soundfile as sf

            # Basic voice characteristics
            if gender.lower() == 'male':
                base_freq = 85
                pitch_variation = 0.15
            else:
                base_freq = 165
                pitch_variation = 0.17

            sample_rate = 22050
            duration = min(len(text) * 0.1, 3.0)  # Max 3 seconds
            samples = int(duration * sample_rate)

            # Create a simple modulated tone
            t = np.linspace(0, duration, samples, False)
            frequency = base_freq * (1 + pitch_variation * np.sin(2 * np.pi * 2 * t))

            audio_signal = 0.3 * np.sin(2 * np.pi * frequency * t)
            noise = 0.05 * np.random.normal(0, 1, samples)
            audio_signal += noise
            audio_signal = audio_signal / np.max(np.abs(audio_signal))

            sf.write(str(output_path), audio_signal, sample_rate)

            print(f"Generated fallback voice sample: {output_file}")
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