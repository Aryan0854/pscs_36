# 🚀 AI News Generation System - Installation Guide

## Overview

This guide will help you set up and run the AI News Generation System, a fully autonomous solution that transforms static content into engaging conversational news discussions with multiple AI personas.

## Prerequisites

### System Requirements
- **Python**: 3.8 or higher
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: At least 2GB free space
- **OS**: Windows, macOS, or Linux

### Hardware Recommendations
- **CPU**: Multi-core processor (4+ cores recommended)
- **GPU**: NVIDIA GPU with CUDA support (optional, for faster processing)
- **RAM**: 8GB+ for optimal performance

## Quick Start

### 1. Clone or Download the Project
```bash
# If you have git
git clone <repository-url>
cd ai-news-generation-system

# Or download and extract the ZIP file
```

### 2. Run the Setup Script
```bash
python setup.py
```

This will automatically:
- Install all required dependencies
- Download necessary language models
- Create required directories
- Set up the system for first use

### 3. Start the Application
```bash
python app.py
```

### 4. Access the Web Interface
Open your browser and go to: `http://localhost:5000`

## Manual Installation

If the automated setup doesn't work, follow these manual steps:

### Step 1: Install Python Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Download Language Models
```bash
# Download spaCy English model
python -m spacy download en_core_web_sm

# Download NLTK data
python -c "import nltk; nltk.download('punkt')"
python -c "import nltk; nltk.download('stopwords')"
python -c "import nltk; nltk.download('wordnet')"
```

### Step 3: Create Directories
```bash
mkdir -p uploads outputs/audio outputs/transcripts logs data models
```

### Step 4: Test the Installation
```bash
python test_system.py
```

## Configuration

### Environment Variables
Create a `.env` file in the project root:

```env
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here

# Model Configuration
CUDA_AVAILABLE=true  # Set to false if no GPU

# Optional: Database (for future features)
DATABASE_URL=sqlite:///news_generator.db
```

### Custom Configuration
Edit `config.py` to customize:
- File size limits
- Model parameters
- Persona settings
- Audio output settings

## Usage

### Web Interface
1. **Upload Document**: Select a PDF, DOCX, TXT, or HTML file
2. **Choose Personas**: Select 3-5 AI personas for the discussion
3. **Generate**: Click "Generate News Discussion"
4. **Download**: Get the audio file and transcript

### API Usage
The system also provides a REST API:

```python
import requests

# Upload and process a file
with open('document.pdf', 'rb') as f:
    response = requests.post('http://localhost:5000/upload', 
                           files={'file': f})

result = response.json()
print(f"Generated audio: {result['result']['audio_file']}")
```

### Command Line Usage
```bash
# Process a file directly
python -c "
from src.data_processing.file_parser import FileParser
from src.models.summarizer import HybridSummarizer
# ... your processing code
"
```

## Troubleshooting

### Common Issues

#### 1. Import Errors
```bash
# If you get import errors, make sure you're in the project directory
cd /path/to/ai-news-generation-system
python app.py
```

#### 2. TTS Not Working
```bash
# Install TTS dependencies
pip install TTS
# Or use fallback mode (audio will be silent)
```

#### 3. Memory Issues
```bash
# Reduce batch size in config.py
MODEL_CONFIG['batch_size'] = 1
```

#### 4. CUDA Errors
```bash
# Disable CUDA in config.py
MODEL_CONFIG['device'] = 'cpu'
```

### Performance Optimization

#### For Better Speed:
1. **Use GPU**: Install CUDA and PyTorch with GPU support
2. **Increase RAM**: More RAM allows larger models
3. **SSD Storage**: Faster disk I/O for model loading

#### For Lower Resource Usage:
1. **Reduce Personas**: Use fewer personas (2-3 instead of 5)
2. **Shorter Content**: Process smaller documents
3. **CPU Mode**: Disable GPU acceleration

## Advanced Setup

### Docker Installation
```bash
# Build Docker image
docker build -t ai-news-generator .

# Run container
docker run -p 5000:5000 ai-news-generator
```

### Production Deployment
1. **Use Gunicorn**: `gunicorn -w 4 app:app`
2. **Set Environment**: `FLASK_ENV=production`
3. **Use Redis**: For caching and job queues
4. **SSL Certificate**: For HTTPS

### Custom Model Training
```bash
# Train custom summarization model
python src/models/train_summarizer.py --data your_data.json

# Fine-tune TTS voices
python src/tts/train_voices.py --dataset voice_dataset/
```

## File Formats Supported

| Format | Extension | Notes |
|--------|-----------|-------|
| Text | .txt | Plain text files |
| PDF | .pdf | Extracts text content |
| Word | .docx, .doc | Microsoft Word documents |
| HTML | .html, .htm | Web pages |
| RTF | .rtf | Rich Text Format |

## System Architecture

```
Input Files → File Parser → Text Preprocessor → Summarizer
     ↓              ↓              ↓              ↓
   PDF/DOCX    Text Extraction  Tokenization  Content Analysis
     ↓              ↓              ↓              ↓
Conversation Generator → Dialogue Generator → TTS → Audio Output
     ↓                    ↓              ↓         ↓
  Persona Selection   Multi-turn      Voice    Final Audio
                      Dialogue      Synthesis    File
```

## Support

### Getting Help
1. **Check Logs**: Look in `logs/app.log` for error messages
2. **Run Tests**: `python test_system.py` to diagnose issues
3. **Check Dependencies**: Ensure all packages are installed correctly

### Common Error Messages

#### "Module not found"
```bash
pip install -r requirements.txt
```

#### "CUDA out of memory"
```bash
# Reduce batch size or use CPU
export CUDA_VISIBLE_DEVICES=""
```

#### "TTS model not found"
```bash
pip install TTS
# Or the system will use fallback mode
```

## Next Steps

After successful installation:

1. **Test with Sample**: Upload `test_sample.txt` to verify everything works
2. **Customize Personas**: Modify personas in `src/conversation/persona_generator.py`
3. **Train Models**: Use your own data to improve summarization
4. **Deploy**: Set up for production use

## Contributing

To contribute to the project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `python test_system.py`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Need more help?** Check the README.md file or create an issue in the repository.
