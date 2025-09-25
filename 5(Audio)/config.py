"""
Configuration file for the AI News Generation System.
Contains all system settings, model parameters, and customization options.
"""

import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
AUDIO_DIR = OUTPUT_DIR / "audio"
TRANSCRIPT_DIR = OUTPUT_DIR / "transcripts"
MODEL_DIR = BASE_DIR / "models"

# Create directories if they don't exist
for directory in [UPLOAD_DIR, OUTPUT_DIR, AUDIO_DIR, TRANSCRIPT_DIR, MODEL_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Flask configuration
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = str(UPLOAD_DIR)
    OUTPUT_FOLDER = str(OUTPUT_DIR)
    
    # Database configuration (if needed in future)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///news_generator.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

# File processing configuration
FILE_CONFIG = {
    'allowed_extensions': {'txt', 'pdf', 'docx', 'doc', 'html', 'htm', 'rtf'},
    'max_file_size': 16 * 1024 * 1024,  # 16MB
    'chunk_size': 500,  # Characters per chunk for processing
    'overlap': 50,  # Character overlap between chunks
}

# Text preprocessing configuration
TEXT_CONFIG = {
    'min_sentence_length': 10,
    'max_sentence_length': 200,
    'remove_stopwords': True,
    'lemmatize': True,
    'language': 'english',
}

# Summarization configuration
SUMMARIZATION_CONFIG = {
    'extractive_ratio': 0.7,
    'max_sentences': 5,
    'target_length': 200,
    'min_length': 50,
    'compression_ratio': 0.3,  # Target compression ratio
}

# Model configuration
MODEL_CONFIG = {
    'summarizer_model': 'facebook/bart-large-cnn',
    'tts_model': 'tts_models/en/ljspeech/tacotron2-DDC',
    'device': 'cuda' if os.environ.get('CUDA_AVAILABLE') == 'true' else 'cpu',
    'batch_size': 1,
    'max_length': 1024,
}

# Persona configuration
PERSONA_CONFIG = {
    'default_persona_count': 3,
    'max_personas': 5,
    'min_personas': 2,
    'conversation_length': {
        'short': 3,    # < 100 words
        'medium': 5,   # 100-300 words
        'long': 7      # > 300 words
    }
}

# TTS configuration
TTS_CONFIG = {
    'sample_rate': 22050,
    'sample_width': 2,  # 16-bit
    'channels': 1,      # Mono
    'pause_duration': 500,  # milliseconds between speakers
    'voice_characteristics': {
        'professional': {
            'pitch_modifier': 0.95,
            'speed_modifier': 0.9,
            'tone': 'authoritative'
        },
        'conversational': {
            'pitch_modifier': 1.05,
            'speed_modifier': 1.1,
            'tone': 'friendly'
        },
        'analytical': {
            'pitch_modifier': 0.9,
            'speed_modifier': 0.8,
            'tone': 'methodical'
        },
        'passionate': {
            'pitch_modifier': 1.1,
            'speed_modifier': 1.2,
            'tone': 'energetic'
        }
    }
}

# Audio processing configuration
AUDIO_CONFIG = {
    'output_format': 'wav',
    'bitrate': '192k',
    'normalize': True,
    'fade_in': 100,    # milliseconds
    'fade_out': 200,   # milliseconds
}

# Web interface configuration
WEB_CONFIG = {
    'host': '0.0.0.0',
    'port': 5000,
    'debug': os.environ.get('FLASK_DEBUG', 'false').lower() == 'true',
    'auto_reload': True,
}

# Logging configuration
LOGGING_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file': 'logs/app.log',
    'max_bytes': 10 * 1024 * 1024,  # 10MB
    'backup_count': 5,
}

# Performance configuration
PERFORMANCE_CONFIG = {
    'max_concurrent_requests': 5,
    'request_timeout': 300,  # 5 minutes
    'cache_size': 100,       # Number of items to cache
    'cache_ttl': 3600,       # Cache time-to-live in seconds
}

# Security configuration
SECURITY_CONFIG = {
    'allowed_origins': ['http://localhost:5000', 'http://127.0.0.1:5000'],
    'rate_limit': {
        'requests_per_minute': 60,
        'requests_per_hour': 1000,
    },
    'file_scan': True,  # Scan uploaded files for malware
}

# Development configuration
DEVELOPMENT_CONFIG = {
    'enable_debug_toolbar': True,
    'enable_profiler': False,
    'mock_tts': False,  # Use mock TTS for testing
    'sample_data': True,  # Include sample data for testing
}

# Production configuration
PRODUCTION_CONFIG = {
    'enable_debug_toolbar': False,
    'enable_profiler': False,
    'mock_tts': False,
    'sample_data': False,
    'use_redis': True,  # Use Redis for caching
    'use_celery': True,  # Use Celery for background tasks
}

# Environment-specific configuration
def get_config():
    """Get configuration based on environment."""
    env = os.environ.get('FLASK_ENV', 'development')
    
    if env == 'production':
        return {**globals(), **PRODUCTION_CONFIG}
    else:
        return {**globals(), **DEVELOPMENT_CONFIG}

# Export configuration
config = get_config()

# Validation
def validate_config():
    """Validate configuration settings."""
    errors = []
    
    # Check required directories
    for dir_name, dir_path in [
        ('UPLOAD_DIR', UPLOAD_DIR),
        ('OUTPUT_DIR', OUTPUT_DIR),
        ('AUDIO_DIR', AUDIO_DIR),
        ('TRANSCRIPT_DIR', TRANSCRIPT_DIR)
    ]:
        if not dir_path.exists():
            errors.append(f"{dir_name} does not exist: {dir_path}")
    
    # Check file size limits
    if FILE_CONFIG['max_file_size'] > 50 * 1024 * 1024:  # 50MB
        errors.append("File size limit too high for production use")
    
    # Check persona limits
    if PERSONA_CONFIG['max_personas'] > 10:
        errors.append("Too many personas may cause performance issues")
    
    if errors:
        raise ValueError(f"Configuration validation failed: {'; '.join(errors)}")
    
    return True

# Initialize configuration
if __name__ == "__main__":
    try:
        validate_config()
        print("Configuration validation passed!")
    except ValueError as e:
        print(f"Configuration error: {e}")
        exit(1)
