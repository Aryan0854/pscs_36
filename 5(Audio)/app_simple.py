"""
Simplified Flask application for the AI News Generation System.
This version avoids heavy ML dependencies to prevent conflicts.
"""

import os
import logging
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import json
from pathlib import Path
import uuid
from datetime import datetime

# Suppress warnings
import warnings
warnings.filterwarnings("ignore")

# Import our custom modules (simplified versions)
from src.data_processing.file_parser import FileParser
from src.data_processing.text_preprocessor import TextPreprocessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'

# Enable CORS
CORS(app)

# Create necessary directories
Path(app.config['UPLOAD_FOLDER']).mkdir(exist_ok=True)
Path(app.config['OUTPUT_FOLDER']).mkdir(exist_ok=True)
Path('outputs/audio').mkdir(parents=True, exist_ok=True)
Path('outputs/transcripts').mkdir(parents=True, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx', 'doc', 'html', 'htm', 'rtf'}

# Initialize components
file_parser = FileParser()
text_preprocessor = TextPreprocessor()


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    """Main page."""
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and processing."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            # Generate unique session ID
            session_id = str(uuid.uuid4())
            
            # Save uploaded file
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{session_id}_{filename}")
            file.save(file_path)
            
            # Process the file
            result = process_file_simple(file_path, session_id)
            
            return jsonify({
                'success': True,
                'session_id': session_id,
                'result': result
            })
        
        return jsonify({'error': 'Invalid file type'}), 400
        
    except Exception as e:
        logger.error(f"Error in file upload: {str(e)}")
        return jsonify({'error': str(e)}), 500


def process_file_simple(file_path: str, session_id: str) -> dict:
    """Process uploaded file through a simplified pipeline."""
    try:
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
        
        # Step 5: Generate simple audio (silence for now)
        logger.info("Generating audio...")
        audio_filename = f"{session_id}_news_discussion.wav"
        audio_path = generate_simple_audio(conversation, audio_filename)
        
        # Step 6: Save transcript
        transcript_filename = f"{session_id}_transcript.txt"
        transcript_path = save_transcript(conversation, transcript_filename)
        
        # Clean up uploaded file
        os.remove(file_path)
        
        return {
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
        raise


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
    """Generate simple audio file (silence for now)."""
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


@app.route('/download/<filename>')
def download_file(filename):
    """Download generated files."""
    try:
        # Check if it's an audio file
        if filename.endswith('.wav'):
            file_path = os.path.join('outputs/audio', filename)
        elif filename.endswith('.txt'):
            file_path = os.path.join('outputs/transcripts', filename)
        else:
            return jsonify({'error': 'Invalid file type'}), 400
        
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404
            
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/test')
def test_system():
    """Test the simplified system."""
    try:
        sample_text = "Artificial intelligence is transforming healthcare with new diagnostic tools."
        
        # Test basic processing
        preprocessed = text_preprocessor.preprocess_text(sample_text)
        conversation = generate_simple_conversation(sample_text)
        
        return jsonify({
            'success': True,
            'sample_text': sample_text,
            'preprocessing_stats': preprocessed['metadata'],
            'conversation_turns': len(conversation)
        })
        
    except Exception as e:
        logger.error(f"Error in system test: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.errorhandler(413)
def too_large(e):
    """Handle file too large error."""
    return jsonify({'error': 'File too large. Maximum size is 16MB.'}), 413


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors."""
    return jsonify({'error': 'Page not found'}), 404


@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors."""
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Create sample test file
    sample_file = Path('test_sample.txt')
    if not sample_file.exists():
        with open(sample_file, 'w') as f:
            f.write("""
            Artificial Intelligence (AI) is transforming the way we live and work. 
            From healthcare to finance, AI applications are becoming increasingly sophisticated. 
            Machine learning algorithms can now process vast amounts of data to identify patterns 
            and make predictions with remarkable accuracy.
            """)
    
    print("Starting Simplified AI News Generation System...")
    print("Open your browser to http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
