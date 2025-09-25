# 🚀 End-to-End Custom AI System for Dynamic Conversational News Generation

A fully autonomous AI solution that transforms static content into engaging conversational news discussions with multiple AI personas.

## 🎯 Features

- **Multi-format Input**: Supports PDF, DOCX, TXT, and other text formats
- **Intelligent Summarization**: Custom transformer-based content analysis
- **Conversational Generation**: Multi-persona dialogue creation
- **Text-to-Speech**: Distinct voices for each AI persona
- **Audio Output**: Complete news discussion audio files
- **Web Interface**: User-friendly file upload and playback system

## 🏗️ Architecture

```
Input Files → Data Processing → Content Analysis → Conversation Generation → TTS → Audio Output
     ↓              ↓                ↓                    ↓              ↓         ↓
   PDF/DOCX    Text Extraction   Summarization    Multi-persona    Voice      Final
   TXT/etc.    Preprocessing     Entity Detection   Dialogue       Synthesis   Audio
```

## 🛠️ Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Download spaCy model:
   ```bash
   python -m spacy download en_core_web_sm
   ```
4. Run the application:
   ```bash
   python app.py
   ```

## 📁 Project Structure

```
├── src/
│   ├── data_processing/     # File parsing and preprocessing
│   ├── models/             # Custom ML models
│   ├── conversation/       # Dialogue generation
│   ├── tts/               # Text-to-speech implementation
│   └── audio/             # Audio processing and merging
├── data/                  # Training data and models
├── outputs/               # Generated audio files
├── templates/             # Web interface templates
├── static/               # CSS, JS, and static assets
└── app.py                # Main Flask application
```

## 🚀 Quick Start

1. Upload a document through the web interface
2. The system will automatically process and generate a conversational news discussion
3. Download the audio file and transcript

## 🔧 Customization

- Train your own summarization models
- Fine-tune TTS voices for specific personas
- Modify conversation styles and formats
- Add support for additional file formats

## 📊 Performance Metrics

- BLEU scores for summarization quality
- ROUGE scores for content coverage
- Word Error Rate (WER) for TTS accuracy
- User satisfaction ratings

## 🤝 Contributing

This is a research project demonstrating end-to-end AI system development. Contributions and improvements are welcome!

## 📄 License

MIT License - see LICENSE file for details
