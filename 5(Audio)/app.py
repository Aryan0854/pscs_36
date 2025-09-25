"""
Main Flask application for the AI News Generation System.
Provides web interface for file upload, processing, and audio generation.
"""

import os
import logging
from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for
from flask_cors import CORS
from werkzeug.utils import secure_filename
import json
from pathlib import Path
import uuid
from datetime import datetime

# Suppress PyTorch warnings
os.environ['TORCH_DISABLE_MULTIPROCESSING'] = '1'

# Suppress various warnings
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="nltk")
warnings.filterwarnings("ignore", category=FutureWarning, module="huggingface_hub")
warnings.filterwarnings("ignore", category=UserWarning, module="pygame")
warnings.filterwarnings("ignore", category=RuntimeWarning, module="pydub")

# Import our custom modules
from src.data_processing.file_parser import FileParser
from src.data_processing.text_preprocessor import TextPreprocessor
from src.models.summarizer import HybridSummarizer
from src.conversation.persona_generator import PersonaGenerator
from src.conversation.dialogue_generator import DialogueGenerator
from src.tts.voice_synthesizer import VoiceManager

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

# Initialize AI components
file_parser = FileParser()
text_preprocessor = TextPreprocessor()
summarizer = HybridSummarizer()
persona_generator = PersonaGenerator()
dialogue_generator = DialogueGenerator()
voice_manager = VoiceManager()


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
            result = process_file(file_path, session_id)
            
            return jsonify({
                'success': True,
                'session_id': session_id,
                'result': result
            })
        
        return jsonify({'error': 'Invalid file type'}), 400
        
    except Exception as e:
        logger.error(f"Error in file upload: {str(e)}")
        return jsonify({'error': str(e)}), 500


def process_file(file_path: str, session_id: str) -> dict:
    """Process uploaded file through the AI pipeline."""
    try:
        # Step 1: Parse file
        logger.info(f"Parsing file: {file_path}")
        parsed_content = file_parser.parse_file(file_path)
        
        # Step 2: Preprocess text
        logger.info("Preprocessing text...")
        preprocessed = text_preprocessor.preprocess_text(parsed_content['text'])
        
        # Step 3: Generate summary
        logger.info("Generating summary...")
        summary_result = summarizer.summarize(
            parsed_content['text'], 
            preprocessed['sentences']
        )
        
        # Step 4: Generate personas and conversation structure
        logger.info("Generating conversation structure...")
        personas = persona_generator.select_personas(3)
        conversation_structure = persona_generator.generate_conversation_structure(
            personas, summary_result['summary']
        )
        
        # Step 5: Generate dialogue
        logger.info("Generating dialogue...")
        dialogue = dialogue_generator.generate_dialogue(
            summary_result['summary'], 
            personas, 
            conversation_structure
        )
        
        # Step 6: Prepare for TTS
        logger.info("Preparing for text-to-speech...")
        tts_ready = dialogue_generator.format_dialogue_for_tts(dialogue)
        
        # Step 7: Generate audio
        logger.info("Generating audio...")
        audio_filename = f"{session_id}_news_discussion.wav"
        audio_path = generate_audio(tts_ready, audio_filename)
        
        # Step 8: Save transcript
        transcript_filename = f"{session_id}_transcript.txt"
        transcript_path = save_transcript(dialogue, transcript_filename)
        
        # Clean up uploaded file
        os.remove(file_path)
        
        return {
            'original_text': parsed_content['text'][:500] + "..." if len(parsed_content['text']) > 500 else parsed_content['text'],
            'summary': summary_result['summary'],
            'personas': [{'name': p.name, 'type': p.persona_type.value, 'expertise': p.expertise} for p in personas],
            'dialogue': [{'speaker': turn.speaker, 'content': turn.content} for turn in dialogue],
            'audio_file': audio_filename,
            'transcript_file': transcript_filename,
            'metadata': {
                'original_length': parsed_content['word_count'],
                'summary_length': len(summary_result['summary'].split()),
                'dialogue_turns': len(dialogue),
                'estimated_duration': conversation_structure['metadata']['estimated_duration']
            }
        }
        
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise


def generate_audio(tts_ready: list, filename: str) -> str:
    """Generate audio from TTS-ready dialogue."""
    try:
        # Add voice profiles for each speaker
        for turn in tts_ready:
            speaker = turn['speaker']
            if speaker not in voice_manager.voice_profiles:
                voice_manager.add_persona_voice(speaker, turn['voice_characteristics'])
        
        # Generate audio
        audio_path = voice_manager.synthesize_multi_persona_dialogue(tts_ready, filename)
        return audio_path
        
    except Exception as e:
        logger.error(f"Error generating audio: {str(e)}")
        # Return a placeholder path
        return f"outputs/audio/{filename}"


def save_transcript(dialogue: list, filename: str) -> str:
    """Save dialogue transcript to file."""
    try:
        transcript_path = Path('outputs/transcripts') / filename
        
        with open(transcript_path, 'w', encoding='utf-8') as f:
            f.write("AI-Generated News Discussion Transcript\n")
            f.write("=" * 50 + "\n\n")
            
            for i, turn in enumerate(dialogue, 1):
                f.write(f"{i}. {turn.speaker}:\n")
                f.write(f"   {turn.content}\n\n")
        
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


@app.route('/status/<session_id>')
def get_status(session_id):
    """Get processing status for a session."""
    # This would be implemented with a proper job queue in production
    return jsonify({'status': 'completed', 'session_id': session_id})


@app.route('/api/personas')
def get_personas():
    """Get available personas."""
    try:
        personas = persona_generator.personas
        return jsonify([{
            'name': p.name,
            'type': p.persona_type.value,
            'expertise': p.expertise,
            'speaking_style': p.speaking_style
        } for p in personas])
    except Exception as e:
        logger.error(f"Error getting personas: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/test')
def test_system():
    """Test the AI system with sample content."""
    try:
        sample_text = """
        Artificial Intelligence is revolutionizing healthcare with new diagnostic tools 
        that can detect diseases earlier and more accurately than traditional methods. 
        These AI systems analyze medical images, patient data, and symptoms to provide 
        doctors with valuable insights for treatment decisions.
        """
        
        # Process sample text
        preprocessed = text_preprocessor.preprocess_text(sample_text)
        summary_result = summarizer.summarize(sample_text, preprocessed['sentences'])
        
        return jsonify({
            'success': True,
            'sample_text': sample_text,
            'summary': summary_result['summary'],
            'preprocessing_stats': preprocessed['metadata']
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
            Artificial Intelligence is transforming the way we live and work. 
            From healthcare to finance, AI applications are becoming increasingly sophisticated. 
            Machine learning algorithms can now process vast amounts of data to identify patterns 
            and make predictions with remarkable accuracy. However, with these advances come 
            important questions about ethics, privacy, and the future of human employment.
            """)
    
    print("Starting AI News Generation System...")
    print("Open your browser to http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
