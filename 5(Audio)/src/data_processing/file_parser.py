"""
File parsing module for extracting text from various document formats.
Supports PDF, DOCX, TXT, and other common formats.
"""

import os
import logging
from typing import Dict, List, Optional, Union
from pathlib import Path

# Document parsing libraries
import PyPDF2
from docx import Document
import nltk
from bs4 import BeautifulSoup

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

logger = logging.getLogger(__name__)


class FileParser:
    """Handles parsing of various file formats to extract text content."""
    
    SUPPORTED_EXTENSIONS = {
        '.pdf': 'pdf',
        '.docx': 'docx', 
        '.doc': 'docx',
        '.txt': 'txt',
        '.html': 'html',
        '.htm': 'html',
        '.rtf': 'rtf'
    }
    
    def __init__(self):
        self.parsed_content = {}
        
    def parse_file(self, file_path: Union[str, Path]) -> Dict[str, any]:
        """
        Parse a file and extract its text content.
        
        Args:
            file_path: Path to the file to parse
            
        Returns:
            Dictionary containing extracted text and metadata
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
            
        file_extension = file_path.suffix.lower()
        
        if file_extension not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file format: {file_extension}")
            
        parser_method = getattr(self, f'_parse_{self.SUPPORTED_EXTENSIONS[file_extension]}')
        
        try:
            content = parser_method(file_path)
            result = {
                'text': content,
                'file_name': file_path.name,
                'file_size': file_path.stat().st_size,
                'file_type': file_extension,
                'word_count': len(content.split()),
                'char_count': len(content)
            }
            
            logger.info(f"Successfully parsed {file_path.name}: {result['word_count']} words")
            return result
            
        except Exception as e:
            logger.error(f"Error parsing {file_path}: {str(e)}")
            raise
    
    def _parse_pdf(self, file_path: Path) -> str:
        """Extract text from PDF files."""
        text = ""
        
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                except Exception as e:
                    logger.warning(f"Error extracting text from page {page_num + 1}: {str(e)}")
                    
        return text.strip()
    
    def _parse_docx(self, file_path: Path) -> str:
        """Extract text from DOCX files."""
        try:
            doc = Document(file_path)
            text = ""
            
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text += paragraph.text + "\n"
                    
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error parsing DOCX file: {str(e)}")
            raise
    
    def _parse_txt(self, file_path: Path) -> str:
        """Extract text from plain text files."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read().strip()
        except UnicodeDecodeError:
            # Try with different encodings
            for encoding in ['latin-1', 'cp1252', 'iso-8859-1']:
                try:
                    with open(file_path, 'r', encoding=encoding) as file:
                        return file.read().strip()
                except UnicodeDecodeError:
                    continue
            raise ValueError("Unable to decode text file with any supported encoding")
    
    def _parse_html(self, file_path: Path) -> str:
        """Extract text from HTML files."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                soup = BeautifulSoup(file.read(), 'html.parser')
                
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()
                    
                # Get text and clean up
                text = soup.get_text()
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = ' '.join(chunk for chunk in chunks if chunk)
                
                return text
                
        except Exception as e:
            logger.error(f"Error parsing HTML file: {str(e)}")
            raise
    
    def _parse_rtf(self, file_path: Path) -> str:
        """Extract text from RTF files (basic implementation)."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                
            # Basic RTF text extraction (removes RTF formatting codes)
            import re
            # Remove RTF control words and groups
            text = re.sub(r'\\[a-z]+\d*\s?', '', content)
            text = re.sub(r'[{}]', '', text)
            text = re.sub(r'\s+', ' ', text)
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error parsing RTF file: {str(e)}")
            raise
    
    def batch_parse(self, file_paths: List[Union[str, Path]]) -> List[Dict[str, any]]:
        """
        Parse multiple files in batch.
        
        Args:
            file_paths: List of file paths to parse
            
        Returns:
            List of parsed content dictionaries
        """
        results = []
        
        for file_path in file_paths:
            try:
                result = self.parse_file(file_path)
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to parse {file_path}: {str(e)}")
                results.append({
                    'error': str(e),
                    'file_name': Path(file_path).name,
                    'file_path': str(file_path)
                })
                
        return results


def main():
    """Test the file parser with sample files."""
    parser = FileParser()
    
    # Test with a sample text file
    test_file = "test_sample.txt"
    if os.path.exists(test_file):
        result = parser.parse_file(test_file)
        print(f"Parsed file: {result['file_name']}")
        print(f"Word count: {result['word_count']}")
        print(f"First 200 characters: {result['text'][:200]}...")


if __name__ == "__main__":
    main()
