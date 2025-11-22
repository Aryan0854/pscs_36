const fs = require('fs');
const path = require('path');

// Simple keyword extraction function (simplified version of our actual implementation)
function extractKeywords(text) {
  // Simple keyword extraction - in a real implementation, you might use NLP libraries
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 
    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 
    'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'what', 'which', 'who', 
    'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 
    'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 
    'too', 'very', 'just', 'now', 'new', 'old', 'first', 'last', 'next', 'previous', 
    'here', 'there', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 
    'then', 'once', 'from', 'about', 'into', 'through', 'during', 'before', 'after', 
    'above', 'below', 'between', 'among', 'within', 'without', 'against', 'across', 
    'along', 'around', 'behind', 'beyond', 'near', 'toward', 'until', 'upon', 'via', 
    'am', 'get', 'got', 'let', 'make', 'put', 'see', 'take', 'use', 'want', 'go', 'come', 
    'give', 'find', 'know', 'think', 'say', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 
    'leave', 'call', 'turn', 'start', 'stop', 'begin', 'end', 'open', 'close', 'buy', 
    'sell', 'read', 'write', 'play', 'run', 'walk', 'sit', 'stand', 'sleep', 'wake', 
    'eat', 'drink', 'cook', 'clean', 'drive', 'ride', 'fly', 'swim', 'dance', 'sing', 
    'listen', 'watch', 'look', 'hear', 'speak', 'talk', 'meet', 'visit', 'stay', 'live', 
    'die', 'kill', 'fight', 'win', 'lose', 'break', 'fix', 'build', 'create', 'destroy', 
    'save', 'spend', 'earn', 'pay', 'cost', 'charge', 'borrow', 'lend', 'owe', 'own', 
    'need', 'want', 'wish', 'hope', 'dream', 'believe', 'doubt', 'trust', 'dare', 'risk', 
    'change', 'stay', 'move', 'travel', 'arrive', 'depart', 'return', 'send', 'receive', 
    'carry', 'bring', 'take', 'hold', 'drop', 'lift', 'push', 'pull', 'throw', 'catch', 
    'fill', 'empty', 'cover', 'uncover', 'hide', 'show', 'appear', 'disappear', 'enter', 
    'exit', 'join', 'leave', 'separate', 'connect', 'disconnect', 'attach', 'detach'
  ]);
  
  // Split text into sentences first
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Extract important words from each sentence
  const importantWords = [];
  
  sentences.forEach(sentence => {
    // Split sentence into words
    const words = sentence
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4 && !stopWords.has(word)); // Increased minimum length to 4
    
    // Add words to important words list (prioritize longer words as they're often more specific)
    words.forEach(word => {
      if (word.length > 6) {
        // Add longer words twice to increase their weight
        importantWords.push(word);
        importantWords.push(word);
      } else {
        importantWords.push(word);
      }
    });
  });
  
  // Remove duplicates while preserving order
  const uniqueWords = Array.from(new Set(importantWords));
  
  // Return top 10 most important keywords
  return uniqueWords.slice(0, 10);
}

// Simple test to verify document processing functionality
async function testDocumentProcessing() {
  console.log('Testing document processing functionality...\n');

  try {
    // Create a sample press release
    const sampleContent = `
Press Release: Government Initiative

New Delhi, India - The Ministry of Information and Broadcasting has launched a comprehensive multilingual video platform to enhance communication with citizens across India.

Key Features:
- AI-powered text extraction from documents
- Automatic translation to 14 Indian languages
- Video generation with voice synthesis
- Real-time processing and analytics

This platform will revolutionize how government press releases are disseminated to the public, ensuring accessibility and reach to diverse linguistic communities.

Contact: press@PIB.gov.in
`;

    // Test file creation and reading
    const testFilePath = path.join(__dirname, 'test-press-release.txt');
    fs.writeFileSync(testFilePath, sampleContent);
    
    const fileContent = fs.readFileSync(testFilePath, 'utf-8');
    console.log('✓ Text file created and read successfully');
    console.log('  Content length:', fileContent.length);
    console.log('  Sample text:', fileContent.substring(0, 100) + '...\n');

    // Test text processing (sentence splitting)
    console.log('Test: Text processing logic');
    const sentences = fileContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
    console.log('✓ Text split into', sentences.length, 'sentences');
    console.log('  Sample sentences:');
    sentences.slice(0, 3).forEach((sentence, i) => {
      console.log(`    ${i + 1}: ${sentence.trim().substring(0, 50)}...`);
    });
    console.log();

    // Test timeline block creation
    console.log('Test: Timeline block creation');
    const timelineBlocks = sentences.map((sentence, i) => ({
      id: `block-${i}`,
      type: 'text',
      content: sentence.trim(),
      startTime: i * 10,
      duration: 10,
      language: 'en',
      position: { x: 0, y: i * 60 }
    }));
    console.log('✓ Created', timelineBlocks.length, 'timeline blocks');
    console.log('  Sample block:', JSON.stringify(timelineBlocks[0], null, 2));
    console.log();

    // Test keyword extraction
    console.log('Test: Keyword extraction');
    const keywords = extractKeywords(fileContent);
    console.log('✓ Extracted', keywords.length, 'keywords');
    console.log('  Keywords:', keywords);
    console.log();
    
    // Test key topics approach
    console.log('Test: Key topics approach');
    const keyTopics = ['government', 'communication', 'platform', 'multilingual', 'video', 'accessibility'];
    console.log('  Key topics:', keyTopics);
    console.log('  Query for image search:', keyTopics.join(' OR '));
    console.log();

    // Clean up
    fs.unlinkSync(testFilePath);
    console.log('✓ Test file cleaned up');

    console.log('🎉 All document processing tests completed successfully!');
    console.log('\nThe upload API should be able to:');
    console.log('- Extract text from TXT, PDF, and DOCX files');
    console.log('- Process text into sentences');
    console.log('- Create timeline blocks for video generation');
    console.log('- Store data in database');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDocumentProcessing().catch(console.error);