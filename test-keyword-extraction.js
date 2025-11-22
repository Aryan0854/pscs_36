const { extractKeywords } = require('./lib/utils/web-search');

// Test the keyword extraction with sample text
const sampleText = `
The Ministry of Information and Broadcasting has launched a comprehensive multilingual video platform to enhance communication with citizens across India. 
This platform will revolutionize how government press releases are disseminated to the public, ensuring accessibility and reach to diverse linguistic communities.
Key features include AI-powered text extraction from documents, automatic translation to 14 Indian languages, video generation with voice synthesis, and real-time processing and analytics.
`;

console.log('Sample text:');
console.log(sampleText);
console.log('\nExtracted keywords:');
const keywords = extractKeywords(sampleText);
console.log(keywords);

// Test with key topics approach
const keyTopics = ['government', 'communication', 'platform', 'multilingual', 'video', 'accessibility'];
console.log('\nKey topics approach:');
console.log('Query:', keyTopics.join(' OR '));