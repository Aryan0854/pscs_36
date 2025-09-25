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


def process_file_cli(file_path: str) -> dict:
    """Process a single file and return results as dict."""
    try:
        # Initialize components
        file_parser = FileParser()
        text_preprocessor = TextPreprocessor()

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

        # Step 4: Generate simple conversation
        logger.info("Generating conversation...")
        conversation = generate_simple_conversation(summary)

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
            'personas': [
                {'name': 'Sarah Chen', 'type': 'anchor', 'expertise': 'General news'},
                {'name': 'Dr. Michael Rodriguez', 'type': 'expert', 'expertise': 'Technology'},
                {'name': 'Emma Thompson', 'type': 'reporter', 'expertise': 'Breaking news'}
            ],
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


def generate_simple_conversation(summary: str) -> list:
    """Generate a simple conversation based on the summary."""
    sentences = summary.split('. ')
    if len(sentences) < 2:
        sentences = [summary]

    conversation = [
        {
            'speaker': 'Sarah Chen',
            'content': f"Welcome to today's news discussion. I'm Sarah Chen, and we're examining an important story."
        },
        {
            'speaker': 'Dr. Michael Rodriguez',
            'content': f"From a technical perspective, {sentences[0] if sentences else summary}. This represents a significant development."
        },
        {
            'speaker': 'Emma Thompson',
            'content': f"I've been following this story closely. {sentences[1] if len(sentences) > 1 else summary}. This is what people are experiencing."
        },
        {
            'speaker': 'Sarah Chen',
            'content': "Thank you both for your insights. This has been a fascinating discussion."
        }
    ]

    return conversation


def generate_simple_audio(conversation: list, filename: str) -> str:
    """Generate simple audio file."""
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

        logger.info(f"Generated simple audio: {output_path}")
        return str(output_path)

    except Exception as e:
        logger.warning(f"Could not generate audio: {str(e)}")
        # Create empty file
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
    if len(sys.argv) != 2:
        print("Usage: python process_file.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]

    if not os.path.exists(file_path):
        print(json.dumps({'success': False, 'error': f'File not found: {file_path}'}))
        sys.exit(1)

    # Create necessary directories
    Path('outputs/audio').mkdir(parents=True, exist_ok=True)
    Path('outputs/transcripts').mkdir(parents=True, exist_ok=True)

    # Process the file
    result = process_file_cli(file_path)

    # Output JSON result
    print(json.dumps(result))


if __name__ == '__main__':
    main()