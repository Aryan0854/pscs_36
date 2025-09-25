"""
Setup script for the AI News Generation System.
Handles installation, configuration, and initial setup.
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_command(command, description):
    """Run a command and handle errors."""
    logger.info(f"Running: {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        logger.info(f"✓ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"✗ {description} failed: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 8):
        logger.error("Python 3.8 or higher is required")
        return False
    logger.info(f"✓ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True

def install_dependencies():
    """Install required Python packages."""
    logger.info("Installing Python dependencies...")
    
    # Install from requirements.txt
    if not run_command("pip install -r requirements.txt", "Installing requirements"):
        return False
    
    # Install additional packages that might be needed
    additional_packages = [
        "spacy",
        "nltk",
        "torch",
        "transformers",
        "TTS"
    ]
    
    for package in additional_packages:
        run_command(f"pip install {package}", f"Installing {package}")
    
    return True

def download_spacy_model():
    """Download required spaCy model."""
    logger.info("Downloading spaCy English model...")
    return run_command("python -m spacy download en_core_web_sm", "Downloading spaCy model")

def download_nltk_data():
    """Download required NLTK data."""
    logger.info("Downloading NLTK data...")
    
    nltk_commands = [
        "python -c \"import nltk; nltk.download('punkt')\"",
        "python -c \"import nltk; nltk.download('stopwords')\"",
        "python -c \"import nltk; nltk.download('wordnet')\"",
        "python -c \"import nltk; nltk.download('averaged_perceptron_tagger')\""
    ]
    
    for command in nltk_commands:
        run_command(command, "Downloading NLTK data")
    
    return True

def create_directories():
    """Create necessary directories."""
    logger.info("Creating project directories...")
    
    directories = [
        "uploads",
        "outputs",
        "outputs/audio",
        "outputs/transcripts",
        "logs",
        "data",
        "models"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        logger.info(f"✓ Created directory: {directory}")
    
    return True

def create_sample_files():
    """Create sample files for testing."""
    logger.info("Creating sample files...")
    
    # Sample text file
    sample_text = """
    Artificial Intelligence (AI) has become one of the most transformative technologies 
    of the 21st century. From healthcare to finance, transportation to entertainment, 
    AI is reshaping industries and changing how we live and work. Machine learning 
    algorithms can now process vast amounts of data to identify patterns and make 
    predictions with remarkable accuracy. Deep learning, a subset of machine learning, 
    has enabled breakthroughs in computer vision, natural language processing, and 
    speech recognition. However, with these advances come important questions about 
    ethics, privacy, and the future of human employment. As AI systems become more 
    sophisticated, we must ensure they are developed and deployed responsibly.
    """
    
    with open("test_sample.txt", "w", encoding="utf-8") as f:
        f.write(sample_text.strip())
    
    logger.info("✓ Created test_sample.txt")
    return True

def test_installation():
    """Test if the installation was successful."""
    logger.info("Testing installation...")
    
    test_commands = [
        "python -c \"import torch; print('PyTorch version:', torch.__version__)\"",
        "python -c \"import transformers; print('Transformers version:', transformers.__version__)\"",
        "python -c \"import spacy; nlp = spacy.load('en_core_web_sm'); print('spaCy model loaded successfully')\"",
        "python -c \"import nltk; print('NLTK version:', nltk.__version__)\""
    ]
    
    for command in test_commands:
        if not run_command(command, "Testing package import"):
            return False
    
    return True

def main():
    """Main setup function."""
    logger.info("🚀 Starting AI News Generation System Setup")
    logger.info("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create directories
    if not create_directories():
        logger.error("Failed to create directories")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        logger.error("Failed to install dependencies")
        sys.exit(1)
    
    # Download spaCy model
    if not download_spacy_model():
        logger.warning("Failed to download spaCy model - some features may not work")
    
    # Download NLTK data
    if not download_nltk_data():
        logger.warning("Failed to download NLTK data - some features may not work")
    
    # Create sample files
    if not create_sample_files():
        logger.warning("Failed to create sample files")
    
    # Test installation
    if not test_installation():
        logger.error("Installation test failed")
        sys.exit(1)
    
    logger.info("=" * 50)
    logger.info("🎉 Setup completed successfully!")
    logger.info("")
    logger.info("Next steps:")
    logger.info("1. Run: python app.py")
    logger.info("2. Open your browser to: http://localhost:5000")
    logger.info("3. Upload a document to test the system")
    logger.info("")
    logger.info("For more information, see README.md")

if __name__ == "__main__":
    main()
