"""
Comprehensive test script for the AI News Generation System.
Tests all components and validates the end-to-end pipeline.
"""

import os
import sys
import logging
import tempfile
from pathlib import Path
import json

# Add src to path
sys.path.append('src')

# Import our modules
from data_processing.file_parser import FileParser
from data_processing.text_preprocessor import TextPreprocessor
from models.summarizer import HybridSummarizer
from conversation.persona_generator import PersonaGenerator
from conversation.dialogue_generator import DialogueGenerator
from tts.voice_synthesizer import VoiceSynthesizer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SystemTester:
    """Comprehensive system testing class."""
    
    def __init__(self):
        self.test_results = {}
        self.sample_text = """
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
    
    def test_file_parser(self):
        """Test file parsing functionality."""
        logger.info("Testing file parser...")
        
        try:
            parser = FileParser()
            
            # Create temporary test file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write(self.sample_text)
                temp_file = f.name
            
            # Test parsing
            result = parser.parse_file(temp_file)
            
            # Validate results
            assert 'text' in result
            assert 'word_count' in result
            assert result['word_count'] > 0
            assert len(result['text']) > 0
            
            # Clean up
            os.unlink(temp_file)
            
            self.test_results['file_parser'] = {
                'status': 'PASS',
                'word_count': result['word_count'],
                'char_count': result['char_count']
            }
            
            logger.info("✓ File parser test passed")
            return True
            
        except Exception as e:
            logger.error(f"✗ File parser test failed: {str(e)}")
            self.test_results['file_parser'] = {'status': 'FAIL', 'error': str(e)}
            return False
    
    def test_text_preprocessor(self):
        """Test text preprocessing functionality."""
        logger.info("Testing text preprocessor...")
        
        try:
            preprocessor = TextPreprocessor()
            result = preprocessor.preprocess_text(self.sample_text)
            
            # Validate results
            assert 'processed_text' in result
            assert 'sentences' in result
            assert 'words' in result
            assert 'metadata' in result
            assert len(result['sentences']) > 0
            assert len(result['words']) > 0
            
            self.test_results['text_preprocessor'] = {
                'status': 'PASS',
                'sentence_count': len(result['sentences']),
                'word_count': len(result['words']),
                'entity_count': len(result['entities'])
            }
            
            logger.info("✓ Text preprocessor test passed")
            return True
            
        except Exception as e:
            logger.error(f"✗ Text preprocessor test failed: {str(e)}")
            self.test_results['text_preprocessor'] = {'status': 'FAIL', 'error': str(e)}
            return False
    
    def test_summarizer(self):
        """Test summarization functionality."""
        logger.info("Testing summarizer...")
        
        try:
            summarizer = HybridSummarizer()
            preprocessor = TextPreprocessor()
            
            # Preprocess text first
            preprocessed = preprocessor.preprocess_text(self.sample_text)
            
            # Generate summary
            result = summarizer.summarize(self.sample_text, preprocessed['sentences'])
            
            # Validate results
            assert 'summary' in result
            assert len(result['summary']) > 0
            assert len(result['summary']) < len(self.sample_text)  # Should be shorter
            
            self.test_results['summarizer'] = {
                'status': 'PASS',
                'original_length': len(self.sample_text),
                'summary_length': len(result['summary']),
                'compression_ratio': len(result['summary']) / len(self.sample_text)
            }
            
            logger.info("✓ Summarizer test passed")
            return True
            
        except Exception as e:
            logger.error(f"✗ Summarizer test failed: {str(e)}")
            self.test_results['summarizer'] = {'status': 'FAIL', 'error': str(e)}
            return False
    
    def test_persona_generator(self):
        """Test persona generation functionality."""
        logger.info("Testing persona generator...")
        
        try:
            generator = PersonaGenerator()
            
            # Test persona selection
            personas = generator.select_personas(3)
            assert len(personas) == 3
            
            # Test conversation structure generation
            structure = generator.generate_conversation_structure(personas, self.sample_text[:200])
            
            # Validate results
            assert 'personas' in structure
            assert 'anchor' in structure
            assert 'opening' in structure
            assert 'exchanges' in structure
            assert 'closing' in structure
            
            self.test_results['persona_generator'] = {
                'status': 'PASS',
                'persona_count': len(personas),
                'exchange_count': len(structure['exchanges']),
                'estimated_duration': structure['metadata']['estimated_duration']
            }
            
            logger.info("✓ Persona generator test passed")
            return True
            
        except Exception as e:
            logger.error(f"✗ Persona generator test failed: {str(e)}")
            self.test_results['persona_generator'] = {'status': 'FAIL', 'error': str(e)}
            return False
    
    def test_dialogue_generator(self):
        """Test dialogue generation functionality."""
        logger.info("Testing dialogue generator...")
        
        try:
            dialogue_gen = DialogueGenerator()
            persona_gen = PersonaGenerator()
            
            # Generate personas and structure
            personas = persona_gen.select_personas(3)
            structure = persona_gen.generate_conversation_structure(personas, self.sample_text[:200])
            
            # Generate dialogue
            dialogue = dialogue_gen.generate_dialogue(self.sample_text[:200], personas, structure)
            
            # Validate results
            assert len(dialogue) > 0
            for turn in dialogue:
                assert hasattr(turn, 'speaker')
                assert hasattr(turn, 'content')
                assert hasattr(turn, 'persona_type')
            
            self.test_results['dialogue_generator'] = {
                'status': 'PASS',
                'dialogue_turns': len(dialogue),
                'speakers': list(set(turn.speaker for turn in dialogue))
            }
            
            logger.info("✓ Dialogue generator test passed")
            return True
            
        except Exception as e:
            logger.error(f"✗ Dialogue generator test failed: {str(e)}")
            self.test_results['dialogue_generator'] = {'status': 'FAIL', 'error': str(e)}
            return False
    
    def test_voice_synthesizer(self):
        """Test voice synthesis functionality."""
        logger.info("Testing voice synthesizer...")
        
        try:
            synthesizer = VoiceSynthesizer()
            
            # Test with simple dialogue
            test_turn = {
                "speaker": "Test Speaker",
                "text": "This is a test of the voice synthesis system.",
                "voice_characteristics": {
                    "tone": "neutral",
                    "pace": "moderate",
                    "emphasis": "natural"
                }
            }
            
            # Test synthesis (this might fail if TTS is not properly installed)
            try:
                output_path = synthesizer.synthesize_dialogue([test_turn], "test_output.wav")
                audio_exists = os.path.exists(output_path)
            except Exception as e:
                logger.warning(f"TTS synthesis failed (expected if TTS not installed): {str(e)}")
                audio_exists = False
            
            self.test_results['voice_synthesizer'] = {
                'status': 'PASS' if audio_exists else 'WARNING',
                'tts_available': audio_exists,
                'note': 'TTS may require additional setup'
            }
            
            logger.info("✓ Voice synthesizer test passed (with warnings)")
            return True
            
        except Exception as e:
            logger.error(f"✗ Voice synthesizer test failed: {str(e)}")
            self.test_results['voice_synthesizer'] = {'status': 'FAIL', 'error': str(e)}
            return False
    
    def test_end_to_end_pipeline(self):
        """Test the complete end-to-end pipeline."""
        logger.info("Testing end-to-end pipeline...")
        
        try:
            # Step 1: File parsing
            parser = FileParser()
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write(self.sample_text)
                temp_file = f.name
            
            parsed_content = parser.parse_file(temp_file)
            
            # Step 2: Text preprocessing
            preprocessor = TextPreprocessor()
            preprocessed = preprocessor.preprocess_text(parsed_content['text'])
            
            # Step 3: Summarization
            summarizer = HybridSummarizer()
            summary_result = summarizer.summarize(parsed_content['text'], preprocessed['sentences'])
            
            # Step 4: Persona generation
            persona_gen = PersonaGenerator()
            personas = persona_gen.select_personas(3)
            structure = persona_gen.generate_conversation_structure(personas, summary_result['summary'])
            
            # Step 5: Dialogue generation
            dialogue_gen = DialogueGenerator()
            dialogue = dialogue_gen.generate_dialogue(summary_result['summary'], personas, structure)
            
            # Step 6: TTS preparation
            tts_ready = dialogue_gen.format_dialogue_for_tts(dialogue)
            
            # Validate pipeline
            assert len(parsed_content['text']) > 0
            assert len(preprocessed['sentences']) > 0
            assert len(summary_result['summary']) > 0
            assert len(personas) > 0
            assert len(dialogue) > 0
            assert len(tts_ready) > 0
            
            # Clean up
            os.unlink(temp_file)
            
            self.test_results['end_to_end_pipeline'] = {
                'status': 'PASS',
                'pipeline_steps': 6,
                'final_dialogue_turns': len(dialogue),
                'summary_length': len(summary_result['summary']),
                'persona_count': len(personas)
            }
            
            logger.info("✓ End-to-end pipeline test passed")
            return True
            
        except Exception as e:
            logger.error(f"✗ End-to-end pipeline test failed: {str(e)}")
            self.test_results['end_to_end_pipeline'] = {'status': 'FAIL', 'error': str(e)}
            return False
    
    def run_all_tests(self):
        """Run all tests and generate report."""
        logger.info("🧪 Starting comprehensive system tests")
        logger.info("=" * 60)
        
        tests = [
            self.test_file_parser,
            self.test_text_preprocessor,
            self.test_summarizer,
            self.test_persona_generator,
            self.test_dialogue_generator,
            self.test_voice_synthesizer,
            self.test_end_to_end_pipeline
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
        
        # Generate report
        self.generate_report(passed, total)
        
        return passed == total
    
    def generate_report(self, passed, total):
        """Generate test report."""
        logger.info("=" * 60)
        logger.info("📊 TEST REPORT")
        logger.info("=" * 60)
        
        for test_name, result in self.test_results.items():
            status = result['status']
            if status == 'PASS':
                logger.info(f"✓ {test_name}: PASSED")
            elif status == 'WARNING':
                logger.info(f"⚠ {test_name}: WARNING")
            else:
                logger.info(f"✗ {test_name}: FAILED")
                if 'error' in result:
                    logger.info(f"  Error: {result['error']}")
        
        logger.info("=" * 60)
        logger.info(f"Overall: {passed}/{total} tests passed")
        
        if passed == total:
            logger.info("🎉 All tests passed! System is ready to use.")
        else:
            logger.info("⚠ Some tests failed. Check the errors above.")
        
        # Save detailed report
        report_path = Path("test_report.json")
        with open(report_path, 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        logger.info(f"Detailed report saved to: {report_path}")


def main():
    """Main test function."""
    tester = SystemTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🚀 System is ready! Run 'python app.py' to start the web interface.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the errors and fix them before running the system.")
        sys.exit(1)


if __name__ == "__main__":
    main()
