# 🎭 Pre-Recorded Voice Samples for AI Hosts

Use real human voices instead of computer-generated speech for your AI news discussions!

## 🎵 How It Works

1. **Upload Voice Samples**: Upload MP3/WAV files (up to 10MB each) for each host
2. **Voice Previews**: Click "🎧 Sample" to hear your custom voices
3. **Audio Generation**: Full discussions still use TTS, but previews use your voices

## 🎤 Getting Voice Samples

### Option 1: Download Free Samples
```bash
cd 5(Audio)
python download_voice_samples.py
```

### Option 2: Record Your Own Voices
1. **Download Audacity** (free audio editor): https://www.audacityteam.org/
2. **Record Samples**: Have actors/friends record 5-10 second voice samples
3. **Save as MP3/WAV**: Export in common audio formats

### Option 3: Free Voice Libraries
- **FreeSound**: https://freesound.org/ (search for "voice", "speech", "narration")
- **ZapSplat**: https://www.zapsplat.com/ (free voice samples)
- **YouTube Audio Library**: Search for "voice samples" or "narration"

## 🎭 Voice Sample Guidelines

### What to Record:
- **Natural Speech**: "Hello, I'm [Name], a [profession] reporting on current events."
- **Personality Match**: Record samples that match the host's personality
- **Clear Audio**: Good microphone, minimal background noise
- **5-10 Seconds**: Enough for a good preview

### File Requirements:
- **Formats**: MP3, WAV, M4A, OGG
- **Size**: Up to 10MB per file
- **Quality**: 44.1kHz recommended

## 🎯 Voice Personality Examples

### Professional Male
- Sample Text: "This is John Smith, senior correspondent for international news."
- Voice Style: Clear, authoritative, confident delivery

### Engaging Female
- Sample Text: "Hi everyone! I'm Sarah with the latest breaking news update."
- Voice Style: Warm, energetic, conversational tone

### Authoritative Male
- Sample Text: "In this special report, we examine the key developments."
- Voice Style: Deep, commanding, serious tone

### Warm Female
- Sample Text: "Let's talk about this important story affecting our community."
- Voice Style: Gentle, caring, approachable manner

## 🚀 Using Custom Voices

1. **Configure Hosts**: Set up your AI hosts with names and personalities
2. **Upload Voices**: Click "📤 Upload Voice" for each host
3. **Test Samples**: Click "🎧 Sample" to preview your custom voices
4. **Generate Audio**: Full discussions use enhanced TTS (ElevenLabs/OpenAI if available, or gTTS)

## 💡 Pro Tips

- **Match Personalities**: Choose voice samples that fit each host's character
- **Consistent Quality**: Use similar recording quality for all voices
- **Test Combinations**: Try different voice pairings for interesting dynamics
- **Backup Plan**: TTS still works if you don't upload custom voices

## 🔧 Technical Details

- **Storage**: Voice files stored temporarily in browser memory
- **Playback**: HTML5 Audio API for instant playback
- **Validation**: Automatic file type and size checking
- **Fallback**: Seamless fallback to TTS if custom voices unavailable

---

**🎉 Now your AI news discussions can feature real human voices with authentic personalities!**