#!/usr/bin/env python3
"""
Command-line script to process a single file and generate audio.
Used by the Next.js API to generate audio from uploaded files.
"""

import os
import sys
import json
import logging
from pathlib import Path

# Add src to path
sys.path.append('src')

# Import our custom modules
from data_processing.file_parser import FileParser
from data_processing.text_preprocessor import TextPreprocessor

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def process_file_cli(file_path: str, personas_config: list = None) -> dict:
    """Process a single file and return results as dict."""
    try:
        # Initialize components
        file_parser = FileParser()
        text_preprocessor = TextPreprocessor()

        # Use provided personas or default ones
        if personas_config and len(personas_config) > 0:
            personas = personas_config
        else:
            personas = [
                {'name': 'Sarah Chen', 'type': 'anchor', 'expertise': 'General news'},
                {'name': 'Dr. Michael Rodriguez', 'type': 'expert', 'expertise': 'Technology'},
                {'name': 'Emma Thompson', 'type': 'reporter', 'expertise': 'Breaking news'}
            ]

        # Step 1: Parse file
        logger.info(f"Parsing file: {file_path}")
        parsed_content = file_parser.parse_file(file_path)

        # Step 2: Preprocess text
        logger.info("Preprocessing text...")
        preprocessed = text_preprocessor.preprocess_text(parsed_content['text'])

        # Step 3: Simple summarization (extract first few sentences)
        logger.info("Generating summary...")
        sentences = preprocessed['sentences']
        summary = '. '.join(sentences[:3]) + '.' if len(sentences) >= 3 else '. '.join(sentences)

        # Step 4: Generate conversation using provided personas
        logger.info("Generating conversation...")
        conversation = generate_conversation_with_personas(summary, personas)

        # Step 5: Generate simple audio
        logger.info("Generating audio...")
        import uuid
        session_id = str(uuid.uuid4())
        audio_filename = f"{session_id}_news_discussion.wav"
        audio_path = generate_simple_audio(conversation, audio_filename)

        # Step 6: Save transcript
        transcript_filename = f"{session_id}_transcript.txt"
        transcript_path = save_transcript(conversation, transcript_filename)

        # Clean up uploaded file
        os.remove(file_path)

        return {
            'success': True,
            'original_text': parsed_content['text'][:500] + "..." if len(parsed_content['text']) > 500 else parsed_content['text'],
            'summary': summary,
            'personas': personas,
            'dialogue': conversation,
            'audio_file': audio_filename,
            'transcript_file': transcript_filename,
            'metadata': {
                'original_length': parsed_content['word_count'],
                'summary_length': len(summary.split()),
                'dialogue_turns': len(conversation),
                'estimated_duration': len(conversation) * 10
            }
        }

    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def generate_conversation_with_personas(summary: str, personas: list) -> list:
    """Generate a conversation using the provided personas."""
    sentences = summary.split('. ')
    if len(sentences) < 2:
        sentences = [summary]

    conversation = []

    # Opening statement by first persona
    if len(personas) > 0:
        conversation.append({
            'speaker': personas[0]['name'],
            'content': f"Welcome to today's news discussion. I'm {personas[0]['name']}, and we're examining an important story."
        })

    # Main discussion points
    for i, sentence in enumerate(sentences[:min(len(sentences), len(personas))]):
        persona_index = (i + 1) % len(personas)
        persona = personas[persona_index]

        if i == 0 and len(personas) > 1:
            content = f"From my perspective as a {persona.get('type', 'expert')}, {sentence}. This represents a significant development."
        elif i == 1 and len(personas) > 2:
            content = f"I've been following this story closely. {sentence}. This is what people are experiencing."
        else:
            content = f"That's an important point. {sentence}. Let me add some context to this."

        conversation.append({
            'speaker': persona['name'],
            'content': content
        })

    # Closing statement
    if len(personas) > 0:
        last_persona = personas[-1]
        conversation.append({
            'speaker': last_persona['name'],
            'content': "Thank you all for your insights. This has been a fascinating discussion."
        })

    return conversation


def generate_simple_audio(conversation: list, filename: str) -> str:
    """Generate audio file with text-to-speech."""
    try:
        from gtts import gTTS
        import pygame
        from pydub import AudioSegment
        import io

        # Create output directory
        output_path = Path('outputs/audio') / filename
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Combine all dialogue into a single audio file
        combined_audio = AudioSegment.empty()

        for i, turn in enumerate(conversation):
            text = f"{turn['speaker']}: {turn['content']}"

            # Generate TTS audio for this turn
            tts = gTTS(text=text, lang='en', slow=False)

            # Save to temporary buffer
            temp_buffer = io.BytesIO()
            tts.write_to_fp(temp_buffer)
            temp_buffer.seek(0)

            # Load audio segment
            audio_segment = AudioSegment.from_mp3(temp_buffer)

            # Add a short pause between speakers
            if i > 0:
                combined_audio += AudioSegment.silent(duration=500)  # 0.5 second pause

            combined_audio += audio_segment

        # Export as WAV
        combined_audio.export(str(output_path), format='wav')

        logger.info(f"Generated TTS audio: {output_path}")
        return str(output_path)

    except ImportError as e:
        logger.warning(f"TTS libraries not available: {str(e)}. Falling back to simple audio.")
        # Fallback to simple audio generation
        try:
            import numpy as np
            import soundfile as sf

            # Create a simple audio file with silence
            duration = len(conversation) * 2  # 2 seconds per turn
            sample_rate = 22050
            samples = int(duration * sample_rate)

            # Generate silence
            audio_data = np.zeros(samples, dtype=np.float32)

            # Save audio file
            output_path = Path('outputs/audio') / filename
            sf.write(str(output_path), audio_data, sample_rate)

            logger.info(f"Generated fallback audio: {output_path}")
            return str(output_path)

        except Exception as fallback_error:
            logger.error(f"Fallback audio generation failed: {str(fallback_error)}")
            # Create empty file
            output_path = Path('outputs/audio') / filename
            output_path.touch()
            return str(output_path)

    except Exception as e:
        logger.error(f"TTS generation failed: {str(e)}")
        # Fallback to simple audio
        try:
            import numpy as np
            import soundfile as sf

            duration = len(conversation) * 2
            sample_rate = 22050
            samples = int(duration * sample_rate)
            audio_data = np.zeros(samples, dtype=np.float32)

            output_path = Path('outputs/audio') / filename
            sf.write(str(output_path), audio_data, sample_rate)

            return str(output_path)
        except Exception as fallback_error:
            logger.error(f"Complete fallback failed: {str(fallback_error)}")
            output_path = Path('outputs/audio') / filename
            output_path.touch()
            return str(output_path)


def save_transcript(conversation: list, filename: str) -> str:
    """Save conversation transcript to file."""
    try:
        transcript_path = Path('outputs/transcripts') / filename

        with open(transcript_path, 'w', encoding='utf-8') as f:
            f.write("AI-Generated News Discussion Transcript\n")
            f.write("=" * 50 + "\n\n")

            for i, turn in enumerate(conversation, 1):
                f.write(f"{i}. {turn['speaker']}:\n")
                f.write(f"   {turn['content']}\n\n")

        return str(transcript_path)

    except Exception as e:
        logger.error(f"Error saving transcript: {str(e)}")
        return ""


def main():
    """Main CLI function."""
    if len(sys.argv) < 2:
        print("Usage: python process_file.py <file_path> [personas_json]")
        sys.exit(1)

    file_path = sys.argv[1]
    personas_config = None

    if len(sys.argv) > 2:
        try:
            personas_config = json.loads(sys.argv[2])
        except json.JSONDecodeError:
            print("Invalid personas JSON")
            sys.exit(1)

    if not os.path.exists(file_path):
        print(json.dumps({'success': False, 'error': f'File not found: {file_path}'}))
        sys.exit(1)

    # Create necessary directories
    Path('outputs/audio').mkdir(parents=True, exist_ok=True)
    Path('outputs/transcripts').mkdir(parents=True, exist_ok=True)

    # Process the file
    result = process_file_cli(file_path, personas_config)

    # Output JSON result
    print(json.dumps(result))


if __name__ == '__main__':
    main()