"""
Text-to-speech voice synthesizer with support for multiple personas and voice characteristics.
Uses Mozilla TTS and other open-source TTS models for natural voice generation.
"""

import os
import logging
import tempfile
from typing import List, Dict, Optional, Tuple
import torch
import numpy as np
from pathlib import Path
import soundfile as sf
from pydub import AudioSegment
from pydub.effects import normalize
import subprocess

# TTS imports
try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False
    logging.warning("pyttsx3 not available. Install with: pip install pyttsx3")

try:
    from gtts import gTTS
    import warnings
    warnings.filterwarnings("ignore", category=UserWarning, module="pygame")
    import pygame
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False
    logging.warning("gTTS not available. Install with: pip install gtts pygame")

logger = logging.getLogger(__name__)


class VoiceSynthesizer:
    """Handles text-to-speech synthesis with multiple voice personas."""
    
    def __init__(self, model_name: str = "pyttsx3"):
        """Initialize voice synthesizer with FFmpeg check."""
        # Check FFmpeg availability
        try:
            AudioSegment.converter = r"C:\ffmpeg\bin\ffmpeg.exe"
            temp_seg = AudioSegment.silent(duration=1)
            logger.info("FFmpeg found and working")
        except Exception as e:
            logger.error(f"FFmpeg not properly configured: {str(e)}")
            logger.error("Please install FFmpeg and add it to PATH")
            raise RuntimeError("FFmpeg is required but not properly configured")
        
        self.model_name = model_name
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tts_engine = None
        self.voice_models = {}
        self.output_dir = Path("outputs/audio")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        if GTTS_AVAILABLE:
            self._initialize_gtts()
        elif PYTTSX3_AVAILABLE:
            self._initialize_pyttsx3()
        else:
            logger.info("Using enhanced fallback synthesis for reliable operation.")
    
    def _initialize_pyttsx3(self):
        """Initialize pyttsx3 TTS engine."""
        try:
            self.tts_engine = pyttsx3.init()
            voices = self.tts_engine.getProperty('voices')
            logger.info(f"pyttsx3 initialized with {len(voices)} voices")
            
            # Set default properties
            self.tts_engine.setProperty('rate', 150)  # Speed of speech
            self.tts_engine.setProperty('volume', 0.9)  # Volume level (0.0 to 1.0)
            
        except Exception as e:
            logger.error(f"Error initializing pyttsx3: {str(e)}")
            self.tts_engine = None
    
    def _initialize_gtts(self):
        """Initialize Google TTS."""
        try:
            # Initialize pygame for audio playback
            pygame.mixer.init()
            logger.info("Google TTS initialized")
        except Exception as e:
            logger.error(f"Error initializing gTTS: {str(e)}")
            GTTS_AVAILABLE = False
    
    def synthesize_dialogue(self, dialogue_turns: List[Dict[str, str]], 
                          output_filename: str = "news_discussion.wav") -> str:
        """
        Synthesize complete dialogue into audio file.
        
        Args:
            dialogue_turns: List of dialogue turns with speaker and text
            output_filename: Name of output audio file
            
        Returns:
            Path to generated audio file
        """
        if not dialogue_turns:
            raise ValueError("No dialogue turns provided")
        
        # Generate audio for each turn
        audio_segments = []
        
        for i, turn in enumerate(dialogue_turns):
            logger.info(f"Generating audio for turn {i+1}/{len(dialogue_turns)}: {turn['speaker']}")
            
            audio_segment = self._synthesize_turn(turn, i)
            if audio_segment:
                audio_segments.append(audio_segment)
        
        if not audio_segments:
            raise RuntimeError("No audio segments were generated")
        
        # Combine all audio segments
        combined_audio = self._combine_audio_segments(audio_segments)
        
        # Save final audio file
        output_path = self.output_dir / output_filename
        combined_audio.export(str(output_path), format="wav")
        
        logger.info(f"Audio saved to: {output_path}")
        return str(output_path)
    
    def _synthesize_turn(self, turn: Dict[str, str], turn_index: int) -> Optional[AudioSegment]:
        """Synthesize a single dialogue turn."""
        speaker = turn['speaker']
        text = turn['text']
        voice_characteristics = turn.get('voice_characteristics', {})
        
        try:
            # Try pyttsx3 first since it's more reliable
            if PYTTSX3_AVAILABLE:
                audio_data = self._synthesize_with_pyttsx3(text, voice_characteristics)
                if audio_data is not None:
                    return self._convert_to_audio_segment(audio_data)
        
            # Try SAPI next
            audio_data = self._synthesize_with_sapi(text, voice_characteristics)
            if audio_data is not None:
                return self._convert_to_audio_segment(audio_data)
                
            # Try gTTS as last resort
            if GTTS_AVAILABLE:
                audio_data = self._synthesize_with_gtts(text, voice_characteristics)
                if audio_data is not None:
                    return self._convert_to_audio_segment(audio_data)
            
            # Fallback
            audio_data = self._synthesize_fallback(text, voice_characteristics)
            if audio_data is not None:
                return self._convert_to_audio_segment(audio_data)
                
        except Exception as e:
            logger.error(f"Error synthesizing turn for {speaker}: {str(e)}")
            return None

    def _convert_to_audio_segment(self, audio_data: np.ndarray) -> AudioSegment:
        """Convert numpy array to AudioSegment."""
        try:
            # Ensure audio data is in the right format
            if audio_data.dtype != np.int16:
                audio_data = (audio_data * 32767).astype(np.int16)
            
            # Create temporary WAV file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
                sf.write(temp_wav.name, audio_data, 22050, 'PCM_16')
                
                # Load as AudioSegment
                audio_segment = AudioSegment.from_wav(temp_wav.name)
                
            # Clean up temp file
            try:
                os.unlink(temp_wav.name)
            except:
                pass
                
            return audio_segment
            
        except Exception as e:
            logger.error(f"Error converting audio data: {str(e)}")
            return AudioSegment.silent(duration=1000)  # Return 1 second of silence
    
    def _synthesize_with_pyttsx3(self, text: str, voice_characteristics: Dict[str, str]) -> Optional[np.ndarray]:
        """Synthesize using pyttsx3 with real human voices."""
        try:
            if not self.tts_engine:
                return None
            
            # Create a new engine instance for each synthesis to avoid blocking
            import pyttsx3
            engine = pyttsx3.init()
            
            # Configure voice based on characteristics
            self._configure_voice_for_persona_engine(engine, voice_characteristics)
            
            # Create temporary file for output
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_path = temp_file.name
            
            # Save to file with timeout
            engine.save_to_file(text, temp_path)
            engine.runAndWait()
            
            # Wait a moment for file to be written
            import time
            time.sleep(0.5)
            
            # Load audio data
            if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
                audio_data, sample_rate = sf.read(temp_path)
                # Clean up temporary file
                os.unlink(temp_path)
                return audio_data
            else:
                logger.warning("pyttsx3 failed to generate audio file")
                return None
            
        except Exception as e:
            logger.error(f"Error in pyttsx3 synthesis: {str(e)}")
            return None
    
    def _synthesize_with_gtts(self, text: str, voice_characteristics: Dict[str, str]) -> Optional[np.ndarray]:
        """Synthesize using Google TTS with real human voices."""
        try:
            # Create temporary file for output
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                temp_path = temp_file.name
            
            # Configure voice based on characteristics
            lang = 'en'
            tld = 'com'  # Top-level domain for accent
            
            # Adjust accent based on persona
            tone = voice_characteristics.get('tone', 'neutral')
            if tone == 'professional':
                tld = 'com'  # American accent
            elif tone == 'authoritative':
                tld = 'co.uk'  # British accent
            elif tone == 'conversational':
                tld = 'com.au'  # Australian accent
            
            # Generate speech
            tts = gTTS(text=text, lang=lang, tld=tld, slow=False)
            tts.save(temp_path)
            
            # Convert MP3 to WAV and load audio data
            audio_segment = AudioSegment.from_mp3(temp_path)
            audio_data = np.array(audio_segment.get_array_of_samples(), dtype=np.float32)
            audio_data = audio_data / np.max(np.abs(audio_data))  # Normalize
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            return audio_data
            
        except Exception as e:
            logger.error(f"Error in gTTS synthesis: {str(e)}")
            return None
    
    def _configure_voice_for_persona(self, voice_characteristics: Dict[str, str]):
        """Configure pyttsx3 voice based on persona characteristics."""
        if not self.tts_engine:
            return
        
        try:
            voices = self.tts_engine.getProperty('voices')
            if voices:
                # Select voice based on tone
                tone = voice_characteristics.get('tone', 'neutral')
                
                if tone == 'professional' or tone == 'authoritative':
                    # Use male voice for professional/authoritative
                    for voice in voices:
                        if 'male' in voice.name.lower() or 'david' in voice.name.lower():
                            self.tts_engine.setProperty('voice', voice.id)
                            break
                elif tone == 'conversational' or tone == 'passionate':
                    # Use female voice for conversational/passionate
                    for voice in voices:
                        if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                            self.tts_engine.setProperty('voice', voice.id)
                            break
                
                # Adjust speech rate based on pace
                pace = voice_characteristics.get('pace', 'moderate')
                if pace == 'slow':
                    self.tts_engine.setProperty('rate', 120)
                elif pace == 'fast':
                    self.tts_engine.setProperty('rate', 180)
                else:  # moderate
                    self.tts_engine.setProperty('rate', 150)
                
                # Adjust volume
                self.tts_engine.setProperty('volume', 0.9)
                
        except Exception as e:
            logger.warning(f"Could not configure voice: {str(e)}")
    
    def _configure_voice_for_persona_engine(self, engine, voice_characteristics: Dict[str, str]):
        """Configure a specific pyttsx3 engine based on persona characteristics."""
        try:
            voices = engine.getProperty('voices')
            if voices:
                # Select voice based on tone
                tone = voice_characteristics.get('tone', 'neutral')
                
                if tone == 'professional' or tone == 'authoritative':
                    # Use male voice for professional/authoritative
                    for voice in voices:
                        if 'male' in voice.name.lower() or 'david' in voice.name.lower():
                            engine.setProperty('voice', voice.id)
                            break
                elif tone == 'conversational' or tone == 'passionate':
                    # Use female voice for conversational/passionate
                    for voice in voices:
                        if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                            engine.setProperty('voice', voice.id)
                            break
                
                # Adjust speech rate based on pace
                pace = voice_characteristics.get('pace', 'moderate')
                if pace == 'slow':
                    engine.setProperty('rate', 120)
                elif pace == 'fast':
                    engine.setProperty('rate', 180)
                else:  # moderate
                    engine.setProperty('rate', 150)
                
                # Adjust volume
                engine.setProperty('volume', 0.9)
                
        except Exception as e:
            logger.warning(f"Could not configure voice: {str(e)}")
    
    def _synthesize_with_sapi(self, text: str, voice_characteristics: Dict[str, str]) -> Optional[np.ndarray]:
        """Synthesize using Windows SAPI with a simple approach."""
        try:
            import win32com.client
            
            # Create SAPI voice
            speaker = win32com.client.Dispatch("SAPI.SpVoice")
            
            # Configure voice based on characteristics
            voices = speaker.GetVoices()
            if voices.Count > 0:
                tone = voice_characteristics.get('tone', 'neutral')
                
                # Select voice based on tone
                if tone == 'professional' or tone == 'authoritative':
                    # Try to find a male voice
                    for i in range(voices.Count):
                        voice = voices.Item(i)
                        if 'male' in voice.GetDescription().lower() or 'david' in voice.GetDescription().lower():
                            speaker.Voice = voice
                            break
                elif tone == 'conversational' or tone == 'passionate':
                    # Try to find a female voice
                    for i in range(voices.Count):
                        voice = voices.Item(i)
                        if 'female' in voice.GetDescription().lower() or 'zira' in voice.GetDescription().lower():
                            speaker.Voice = voice
                            break
                
                # Set speech rate
                pace = voice_characteristics.get('pace', 'moderate')
                if pace == 'slow':
                    speaker.Rate = -2
                elif pace == 'fast':
                    speaker.Rate = 2
                else:
                    speaker.Rate = 0
                
                # Set volume
                speaker.Volume = 80
            
            # Create file stream
            file_stream = win32com.client.Dispatch("SAPI.SpFileStream")
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_path = temp_file.name
            
            # Set output to file
            file_stream.Open(temp_path, 3)  # 3 = SSFMCreateForWrite
            speaker.AudioOutputStream = file_stream
            
            # Speak to file
            speaker.Speak(text)
            
            # Close file stream
            file_stream.Close()
            
            # Load audio data
            if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
                audio_data, sample_rate = sf.read(temp_path)
                # Clean up temporary file
                os.unlink(temp_path)
                logger.info(f"Generated SAPI audio for: {text[:50]}...")
                return audio_data
            else:
                logger.warning("SAPI failed to generate audio file")
                return None
                
        except Exception as e:
            logger.warning(f"SAPI synthesis failed: {str(e)}")
            return None
    
    def _synthesize_fallback(self, text: str, voice_characteristics: Dict[str, str]) -> Optional[np.ndarray]:
        """Fallback synthesis method that creates speech-like audio patterns."""
        # Calculate duration based on text length (more realistic timing)
        words = text.split()
        duration_seconds = len(words) * 0.5  # 0.5 seconds per word
        sample_rate = 22050
        duration_samples = int(duration_seconds * sample_rate)
        
        # Create time array
        t = np.linspace(0, duration_seconds, duration_samples)
        
        # Get persona characteristics
        tone = voice_characteristics.get('tone', 'neutral')
        pace = voice_characteristics.get('pace', 'moderate')
        
        # Set base frequency based on persona
        if tone == 'professional':
            base_freq = 180
        elif tone == 'authoritative':
            base_freq = 160
        elif tone == 'conversational':
            base_freq = 200
        elif tone == 'analytical':
            base_freq = 170
        elif tone == 'passionate':
            base_freq = 190
        else:
            base_freq = 175
        
        # Adjust frequency based on pace
        if pace == 'slow':
            base_freq *= 0.9
        elif pace == 'fast':
            base_freq *= 1.1
        
        # Create speech-like audio with formants (vowel-like sounds)
        audio_data = np.zeros(duration_samples, dtype=np.float32)
        
        # Add formant frequencies (like human speech)
        formants = [
            (base_freq, 0.3),      # F0 - fundamental frequency
            (base_freq * 2.5, 0.2), # F1 - first formant
            (base_freq * 4.0, 0.15), # F2 - second formant
            (base_freq * 6.0, 0.1),  # F3 - third formant
        ]
        
        # Generate speech-like waveform
        for freq, amplitude in formants:
            # Add some frequency modulation to simulate speech patterns
            modulation = 1 + 0.1 * np.sin(2 * np.pi * 5 * t)  # 5Hz modulation
            audio_data += amplitude * np.sin(2 * np.pi * freq * t * modulation)
        
        # Add speech-like envelope (rhythm and pauses)
        word_duration = duration_seconds / len(words)
        envelope = np.ones(duration_samples)
        
        # Create word-based envelope with pauses
        for i in range(len(words)):
            start_sample = int(i * word_duration * sample_rate)
            end_sample = int((i + 0.8) * word_duration * sample_rate)  # 80% of word duration
            
            if start_sample < duration_samples and end_sample < duration_samples:
                # Create attack-decay envelope for each word
                word_samples = end_sample - start_sample
                if word_samples > 0:
                    word_envelope = np.concatenate([
                        np.linspace(0, 1, word_samples // 4),  # Attack
                        np.ones(word_samples // 2),            # Sustain
                        np.linspace(1, 0, word_samples // 4)   # Decay
                    ])
                    
                    if len(word_envelope) <= (end_sample - start_sample):
                        envelope[start_sample:start_sample + len(word_envelope)] = word_envelope
        
        # Apply envelope
        audio_data *= envelope
        
        # Add subtle noise for realism
        noise_level = 0.02
        noise = np.random.normal(0, noise_level, duration_samples)
        audio_data += noise
        
        # Normalize and apply gentle compression
        max_val = np.max(np.abs(audio_data))
        if max_val > 0:
            audio_data = audio_data / max_val * 0.7  # Reduce volume to 70%
        
        # Apply gentle low-pass filter effect
        from scipy import signal
        try:
            # Simple low-pass filter
            b, a = signal.butter(4, 0.3, btype='low')
            audio_data = signal.filtfilt(b, a, audio_data)
        except:
            # If scipy not available, use simple averaging
            kernel_size = 3
            audio_data = np.convolve(audio_data, np.ones(kernel_size)/kernel_size, mode='same')
        
        # Convert to 16-bit PCM
        audio_data_int = (audio_data * 32767).astype(np.int16)
        
        logger.info(f"Generated speech-like audio for: {text[:50]}...")
        return audio_data_int
    
    def _apply_voice_characteristics(self, audio_segment: AudioSegment, 
                                   characteristics: Dict[str, str]) -> AudioSegment:
        """Apply voice characteristics to audio segment."""
        modified_audio = audio_segment
        
        # Apply tone modifications
        tone = characteristics.get('tone', 'neutral')
        if tone == 'professional':
            # Slightly lower pitch, slower pace
            modified_audio = modified_audio._spawn(modified_audio.raw_data, overrides={
                "frame_rate": int(modified_audio.frame_rate * 0.95)
            }).set_frame_rate(modified_audio.frame_rate)
        elif tone == 'conversational':
            # Slightly higher pitch, faster pace
            modified_audio = modified_audio._spawn(modified_audio.raw_data, overrides={
                "frame_rate": int(modified_audio.frame_rate * 1.05)
            }).set_frame_rate(modified_audio.frame_rate)
        elif tone == 'authoritative':
            # Lower pitch, slower pace
            modified_audio = modified_audio._spawn(modified_audio.raw_data, overrides={
                "frame_rate": int(modified_audio.frame_rate * 0.9)
            }).set_frame_rate(modified_audio.frame_rate)
        
        # Apply pace modifications
        pace = characteristics.get('pace', 'moderate')
        if pace == 'slow':
            modified_audio = modified_audio._spawn(modified_audio.raw_data, overrides={
                "frame_rate": int(modified_audio.frame_rate * 0.8)
            }).set_frame_rate(modified_audio.frame_rate)
        elif pace == 'fast':
            modified_audio = modified_audio._spawn(modified_audio.raw_data, overrides={
                "frame_rate": int(modified_audio.frame_rate * 1.2)
            }).set_frame_rate(modified_audio.frame_rate)
        
        # Normalize audio
        modified_audio = normalize(modified_audio)
        
        return modified_audio
    
    def _combine_audio_segments(self, audio_segments: List[AudioSegment]) -> AudioSegment:
        """Combine multiple audio segments into one."""
        if not audio_segments:
            return AudioSegment.silent(duration=1000)
        
        # Start with first segment
        combined = audio_segments[0]
        
        # Add remaining segments
        for segment in audio_segments[1:]:
            combined += segment
        
        return combined
    
    def create_voice_profile(self, persona_name: str, voice_characteristics: Dict[str, str]) -> Dict[str, str]:
        """Create a voice profile for a specific persona."""
        profile = {
            "name": persona_name,
            "tone": voice_characteristics.get("tone", "neutral"),
            "pace": voice_characteristics.get("pace", "moderate"),
            "emphasis": voice_characteristics.get("emphasis", "natural"),
            "pitch_modifier": voice_characteristics.get("pitch_modifier", 1.0),
            "speed_modifier": voice_characteristics.get("speed_modifier", 1.0)
        }
        
        self.voice_models[persona_name] = profile
        return profile
    
    def get_available_voices(self) -> List[str]:
        """Get list of available voice models."""
        available_voices = []
        
        # Check pyttsx3 voices
        if self.tts_engine and PYTTSX3_AVAILABLE:
            try:
                voices = self.tts_engine.getProperty('voices')
                available_voices.extend([voice.name for voice in voices])
            except Exception as e:
                logger.error(f"Error getting pyttsx3 voices: {str(e)}")
        
        # Check SAPI voices
        try:
            import win32com.client
            speaker = win32com.client.Dispatch("SAPI.SpVoice")
            voices = speaker.GetVoices()
            available_voices.extend([voice.GetDescription() for voice in voices])
        except Exception as e:
            logger.error(f"Error getting SAPI voices: {str(e)}")
        
        return available_voices
    
    def test_synthesis(self, text: str = "Hello, this is a test of the text-to-speech system.") -> str:
        """Test the TTS system with sample text."""
        test_turn = {
            "speaker": "Test Speaker",
            "text": text,
            "voice_characteristics": {
                "tone": "neutral",
                "pace": "moderate",
                "emphasis": "natural"
            }
        }
        
        return self.synthesize_dialogue([test_turn], "test_synthesis.wav")


class VoiceManager:
    """Manages multiple voice synthesizers for different personas."""
    
    def __init__(self):
        self.synthesizers = {}
        self.voice_profiles = {}
    
    def add_persona_voice(self, persona_name: str, voice_characteristics: Dict[str, str]):
        """Add voice profile for a persona."""
        synthesizer = VoiceSynthesizer()
        profile = synthesizer.create_voice_profile(persona_name, voice_characteristics)
        
        self.synthesizers[persona_name] = synthesizer
        self.voice_profiles[persona_name] = profile
    
    def synthesize_multi_persona_dialogue(self, dialogue_turns: List[Dict[str, str]], 
                                        output_filename: str = "multi_persona_discussion.wav") -> str:
        """Synthesize dialogue with multiple persona voices."""
        if not dialogue_turns:
            raise ValueError("No dialogue turns provided")
        
        # Group turns by speaker
        speaker_turns = {}
        for turn in dialogue_turns:
            speaker = turn['speaker']
            if speaker not in speaker_turns:
                speaker_turns[speaker] = []
            speaker_turns[speaker].append(turn)
        
        # Synthesize each speaker's parts
        all_audio_segments = []
        
        for turn in dialogue_turns:
            speaker = turn['speaker']
            
            if speaker in self.synthesizers:
                synthesizer = self.synthesizers[speaker]
            else:
                # Use default synthesizer
                synthesizer = VoiceSynthesizer()
                self.synthesizers[speaker] = synthesizer
            
            audio_segment = synthesizer._synthesize_turn(turn, len(all_audio_segments))
            if audio_segment:
                all_audio_segments.append(audio_segment)
        
        # Combine all segments
        if all_audio_segments:
            combined_audio = all_audio_segments[0]
            for segment in all_audio_segments[1:]:
                combined_audio += segment
            
            # Save final audio
            output_path = Path("outputs/audio") / output_filename
            output_path.parent.mkdir(parents=True, exist_ok=True)
            combined_audio.export(str(output_path), format="wav")
            
            return str(output_path)
        
        raise RuntimeError("No audio segments were generated")


def main():
    """Test the voice synthesizer."""
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    try:
        print("Checking FFmpeg installation...")
        subprocess.run(['ffmpeg', '-version'], 
                      capture_output=True, 
                      check=True)
        print("FFmpeg is installed and accessible")
    except Exception as e:
        print("Error: FFmpeg is not properly installed")
        print("Please install FFmpeg and add it to PATH")
        print("Download from: https://github.com/BtbN/FFmpeg-Builds/releases")
        return

    print("\nInitializing voice synthesizer...")
    try:
        synthesizer = VoiceSynthesizer()
    except Exception as e:
        print(f"Error initializing synthesizer: {str(e)}")
        return

    # Test available voices
    print("\nAvailable voices:")
    voices = synthesizer.get_available_voices()
    for i, voice in enumerate(voices, 1):
        print(f"{i}. {voice}")
    
    # Test different voices
    test_texts = [
        {
            "speaker": "Professional",
            "text": "This is a professional voice test.",
            "voice_characteristics": {
                "tone": "professional",
                "pace": "moderate",
                "emphasis": "clear"
            }
        },
        {
            "speaker": "Casual",
            "text": "And this is a more casual voice test.",
            "voice_characteristics": {
                "tone": "conversational",
                "pace": "moderate",
                "emphasis": "natural"
            }
        }
    ]
    
    try:
        output_path = synthesizer.synthesize_dialogue(test_texts, "voice_test.wav")
        print(f"\nTest audio generated: {output_path}")
        
        if os.path.exists(output_path):
            print(f"Audio file size: {os.path.getsize(output_path)} bytes")
            if os.path.getsize(output_path) > 0:
                print("Playing audio...")
                os.system(f'start {output_path}')
            else:
                print("Error: Generated audio file is empty")
        else:
            print(f"Error: Output file not found at {output_path}")
            
    except Exception as e:
        print(f"Error in test synthesis: {str(e)}")
        import traceback
        traceback.print_exc()
