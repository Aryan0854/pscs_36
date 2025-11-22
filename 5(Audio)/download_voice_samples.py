#!/usr/bin/env python3
"""
Script to download free voice samples for different personalities.
Run this script to get pre-recorded voice samples for your AI hosts.
"""

import requests
from pathlib import Path

# Create voices directory
voices_dir = Path('voices')
voices_dir.mkdir(exist_ok=True)

# High-quality voice samples - Generate TTS samples for perfect voices
VOICE_SAMPLES = {
    # Professional voices - Generate high-quality TTS samples
    'female_professional': {
        'generate_tts': True,
        'text': "Hello, this is Sarah Chen, your professional news anchor bringing you the latest developments with clarity and authority.",
        'tts_config': {'tld': 'us', 'slow': False},  # Clear American English
        'description': 'Professional female news anchor voice',
        'personality': 'Clear, confident, authoritative female voice perfect for news anchoring'
    },
    'male_professional': {
        'generate_tts': True,
        'text': "Good evening, I'm Michael Rodriguez, senior correspondent providing in-depth analysis of current events.",
        'tts_config': {'tld': 'us', 'slow': False},  # Normal American male voice
        'description': 'Professional male correspondent voice',
        'personality': 'Deep, trustworthy male voice ideal for serious reporting'
    },

    # Personality-based voices
    'female_engaging': {
        'generate_tts': True,
        'text': "Hi everyone! I'm Emma Thompson, excited to share this fascinating story with you today!",
        'tts_config': {'tld': 'com.au', 'slow': False},  # Energetic Australian
        'description': 'Engaging female host voice',
        'personality': 'Warm, energetic female voice great for engaging audiences'
    },
    'male_authoritative': {
        'generate_tts': True,
        'text': "In my expert analysis, I can tell you that these developments represent a significant turning point.",
        'tts_config': {'tld': 'us', 'slow': False},  # Normal American male voice
        'description': 'Authoritative male expert voice',
        'personality': 'Commanding, experienced male voice for expert commentary'
    },
    'female_warm': {
        'generate_tts': True,
        'text': "Let's take a moment to understand how this story touches the lives of people in our community.",
        'tts_config': {'tld': 'co.in', 'slow': False},  # Warm Indian English
        'description': 'Warm female storyteller voice',
        'personality': 'Gentle, caring female voice perfect for human interest stories'
    },
    'male_casual': {
        'generate_tts': True,
        'text': "Hey folks, let's chat about what's really going on with this story in a way that makes sense.",
        'tts_config': {'tld': 'us', 'slow': False},  # Normal American male voice
        'description': 'Casual male conversational voice',
        'personality': 'Relaxed, friendly male voice for casual discussions'
    },

    # Additional high-quality options
    'female_confident': {
        'generate_tts': True,
        'text': "With complete confidence, I can assure you that this breakthrough changes everything we thought we knew.",
        'tts_config': {'tld': 'us', 'slow': False},  # Strong American
        'description': 'Confident female leadership voice',
        'personality': 'Bold, assertive female voice for leadership and confidence'
    },
    'male_friendly': {
        'generate_tts': True,
        'text': "I'm really glad we could sit down and talk about this important topic together.",
        'tts_config': {'tld': 'us', 'slow': False},  # Normal American male voice
        'description': 'Friendly male conversational voice',
        'personality': 'Approachable, warm male voice for friendly discussions'
    }
}

def download_voice_sample(name, info):
    """Generate or download a voice sample."""
    try:
        description = info.get('description', '')
        personality = info.get('personality', '')

        print(f"Generating {name}: {description}")
        print(f"   Personality: {personality}")

        if info.get('generate_tts', False):
            # Generate TTS sample
            return generate_tts_sample(name, info)
        else:
            # Download from URL (fallback)
            url = info.get('url', '')
            if url:
                return download_from_url(name, url, description)
            else:
                print(f"❌ No URL or TTS config for {name}")
                return False

    except Exception as e:
        print(f"Error processing {name}: {str(e)}")
        return False


def generate_tts_sample(name, info):
    """Generate a high-quality TTS voice sample."""
    try:
        from gtts import gTTS

        text = info.get('text', f"Hello, this is a {name} voice sample.")
        tts_config = info.get('tts_config', {'tld': 'com', 'slow': False})

        tld = tts_config.get('tld', 'com')
        slow = tts_config.get('slow', False)

        print(f"   Generating TTS with config: tld={tld}, slow={slow}")
        print(f"   Text: {text[:60]}...")

        # Generate TTS
        tts = gTTS(text=text, lang='en', slow=slow, tld=tld)

        # Save as MP3 (better quality than WAV for TTS)
        filename = f"{name}.mp3"
        filepath = voices_dir / filename
        tts.save(str(filepath))

        print(f"Generated TTS sample: {filepath}")
        return True

    except ImportError:
        print("gTTS not installed. Run: pip install gTTS")
        return False
    except Exception as e:
        print(f"TTS generation failed: {str(e)}")
        return False


def download_from_url(name, url, description):
    """Download a voice sample from URL (fallback method)."""
    try:
        print(f"   Downloading from: {url}")
        response = requests.get(url, timeout=30)

        if response.status_code == 200:
            filename = f"{name}.wav"
            filepath = voices_dir / filename

            with open(filepath, 'wb') as f:
                f.write(response.content)

            print(f"Downloaded: {filepath}")
            return True
        else:
            print(f"Failed to download {name}: HTTP {response.status_code}")
            return False

    except Exception as e:
        print(f"Error downloading {name}: {str(e)}")
        return False

def main():
    """Main function to download all voice samples."""
    print("Generating High-Quality Voice Samples for AI Hosts")
    print("=" * 50)
    print()

    downloaded = 0
    total = len(VOICE_SAMPLES)

    for name, info in VOICE_SAMPLES.items():
        if download_voice_sample(name, info):
            downloaded += 1
        print()

    print(f"Generated {downloaded}/{total} high-quality voice samples")
    print(f"Voice samples saved to: {voices_dir.absolute()}")
    print()
    print("Voice Personalities Generated:")
    for name, info in VOICE_SAMPLES.items():
        filepath = voices_dir / f"{name}.mp3"
        if filepath.exists():
            print(f"   [OK] {name}: {info['description']}")
    print()
    print("How to Use:")
    print("   * Upload these .mp3 files in the AI Audio Generator")
    print("   * Each voice is optimized for its personality type")
    print("   * For even better results, record your own voices with Audacity")
    print("   * Mix and match different personality voices for dynamic discussions")

if __name__ == '__main__':
    main()