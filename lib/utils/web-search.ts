import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { createApi } from 'unsplash-js';
import { google } from 'googleapis'; // Add Google APIs client

const exec = promisify(require('child_process').exec);

// Initialize Unsplash API client if API key is available
let unsplash: ReturnType<typeof createApi> | null = null;
if (process.env.UNSPLASH_ACCESS_KEY) {
  unsplash = createApi({
    accessKey: process.env.UNSPLASH_ACCESS_KEY,
  });
}

// Initialize Google Custom Search API client if API key is available
let googleSearch: any = null;
let googleSearchEngineId: string | undefined;
if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
  const customsearch = google.customsearch('v1');
  googleSearch = customsearch;
  googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
}

// Function to search the web for relevant content
export async function searchWeb(query: string, maxResults: number = 5): Promise<Array<{title: string, url: string, snippet: string}>> {
  try {
    // For now, we'll simulate search results
    // In a real implementation, you would integrate with a search API like Google Custom Search API
    console.log(`Searching web for: ${query}`);
    
    // This is a placeholder implementation
    // You would replace this with actual API calls to a search service
    return [
      {
        title: "Relevant Article 1",
        url: "https://example.com/article1",
        snippet: "This is a snippet from a relevant article about the topic."
      },
      {
        title: "Relevant Article 2",
        url: "https://example.com/article2",
        snippet: "This is another snippet from a relevant article about the topic."
      }
    ];
  } catch (error) {
    console.error('Web search error:', error);
    return [];
  }
}

// Highly targeted keyword extraction for any resume/script content
export function extractKeywords(text: string): string[] {
  console.log("Extracting keywords from content...");
  
  // Direct extraction of specific skills and projects from the content
  const extractedKeywords: string[] = [];
  
  // Convert text to lowercase for easier matching
  const lowerText = text.toLowerCase();
  
  // Programming languages and technologies with specific detection
  if (lowerText.includes('python')) extractedKeywords.push('python');
  if (lowerText.includes('javascript')) extractedKeywords.push('javascript');
  if (lowerText.includes('html')) extractedKeywords.push('html');
  if (lowerText.includes('css')) extractedKeywords.push('css');
  if (lowerText.includes('react')) extractedKeywords.push('react');
  if (lowerText.includes('node.js') || lowerText.includes('nodejs')) extractedKeywords.push('nodejs');
  if (lowerText.includes('flask')) extractedKeywords.push('flask');
  if (lowerText.includes('django')) extractedKeywords.push('django');
  if (lowerText.includes('typescript')) extractedKeywords.push('typescript');
  if (lowerText.includes('java')) extractedKeywords.push('java');
  if (lowerText.includes('c++') || lowerText.includes('cpp')) extractedKeywords.push('cpp');
  if (lowerText.includes('c#')) extractedKeywords.push('csharp');
  if (lowerText.includes('php')) extractedKeywords.push('php');
  if (lowerText.includes('ruby')) extractedKeywords.push('ruby');
  if (lowerText.includes('go') || lowerText.includes('golang')) extractedKeywords.push('go');
  
  // AI/ML specific terms with specific detection
  if (lowerText.includes('machine learning') || lowerText.includes('ml')) extractedKeywords.push('machine-learning');
  if (lowerText.includes('artificial intelligence') || lowerText.includes('ai')) extractedKeywords.push('artificial-intelligence');
  if (lowerText.includes('computer vision')) extractedKeywords.push('computer-vision');
  if (lowerText.includes('natural language processing') || lowerText.includes('nlp')) extractedKeywords.push('nlp');
  if (lowerText.includes('deep learning')) extractedKeywords.push('deep-learning');
  if (lowerText.includes('neural network')) extractedKeywords.push('neural-network');
  if (lowerText.includes('tensorflow')) extractedKeywords.push('tensorflow');
  if (lowerText.includes('pytorch')) extractedKeywords.push('pytorch');
  
  // Data analytics tools with specific detection
  if (lowerText.includes('sql')) extractedKeywords.push('sql');
  if (lowerText.includes('pandas')) extractedKeywords.push('pandas');
  if (lowerText.includes('numpy')) extractedKeywords.push('numpy');
  if (lowerText.includes('matplotlib')) extractedKeywords.push('matplotlib');
  if (lowerText.includes('tableau')) extractedKeywords.push('tableau');
  if (lowerText.includes('power bi') || lowerText.includes('powerbi')) extractedKeywords.push('power-bi');
  if (lowerText.includes('excel')) extractedKeywords.push('excel');
  if (lowerText.includes('mongodb')) extractedKeywords.push('mongodb');
  if (lowerText.includes('postgresql') || lowerText.includes('postgres')) extractedKeywords.push('postgresql');
  if (lowerText.includes('mysql')) extractedKeywords.push('mysql');
  if (lowerText.includes('oracle')) extractedKeywords.push('oracle');
  
  // Cloud and DevOps with specific detection
  if (lowerText.includes('aws') || lowerText.includes('amazon web services')) extractedKeywords.push('aws');
  if (lowerText.includes('azure')) extractedKeywords.push('azure');
  if (lowerText.includes('google cloud') || lowerText.includes('gcp')) extractedKeywords.push('gcp');
  if (lowerText.includes('docker')) extractedKeywords.push('docker');
  if (lowerText.includes('kubernetes')) extractedKeywords.push('kubernetes');
  if (lowerText.includes('git')) extractedKeywords.push('git');
  if (lowerText.includes('github')) extractedKeywords.push('github');
  if (lowerText.includes('jenkins')) extractedKeywords.push('jenkins');
  if (lowerText.includes('ci/cd')) extractedKeywords.push('ci-cd');
  
  // Web development frameworks with specific detection
  if (lowerText.includes('angular')) extractedKeywords.push('angular');
  if (lowerText.includes('vue.js') || lowerText.includes('vuejs')) extractedKeywords.push('vuejs');
  if (lowerText.includes('next.js') || lowerText.includes('nextjs')) extractedKeywords.push('nextjs');
  if (lowerText.includes('express')) extractedKeywords.push('express');
  if (lowerText.includes('spring')) extractedKeywords.push('spring');
  
  // Mobile development with specific detection
  if (lowerText.includes('android')) extractedKeywords.push('android');
  if (lowerText.includes('ios')) extractedKeywords.push('ios');
  if (lowerText.includes('flutter')) extractedKeywords.push('flutter');
  if (lowerText.includes('react native')) extractedKeywords.push('react-native');
  if (lowerText.includes('swift')) extractedKeywords.push('swift');
  
  // Specific project types and domains
  if (lowerText.includes('web application') || lowerText.includes('web app')) extractedKeywords.push('web-application');
  if (lowerText.includes('mobile application') || lowerText.includes('mobile app')) extractedKeywords.push('mobile-application');
  if (lowerText.includes('desktop application') || lowerText.includes('desktop app')) extractedKeywords.push('desktop-application');
  if (lowerText.includes('api development') || lowerText.includes('api design')) extractedKeywords.push('api-development');
  if (lowerText.includes('database design') || lowerText.includes('database development')) extractedKeywords.push('database-design');
  
  // Education (generic approach)
  if (lowerText.includes('university') || lowerText.includes('college') || lowerText.includes('institute')) {
    extractedKeywords.push('education');
  }
  
  // Experience and roles
  if (lowerText.includes('developer')) extractedKeywords.push('developer');
  if (lowerText.includes('engineer')) extractedKeywords.push('engineer');
  if (lowerText.includes('analyst')) extractedKeywords.push('analyst');
  if (lowerText.includes('scientist')) extractedKeywords.push('scientist');
  if (lowerText.includes('manager')) extractedKeywords.push('manager');
  if (lowerText.includes('architect')) extractedKeywords.push('architect');
  
  // Certifications (generic approach)
  if (lowerText.includes('certification') || lowerText.includes('certificate')) {
    extractedKeywords.push('certification');
  }
  
  console.log("Extracted content keywords:", extractedKeywords);
  return [...new Set(extractedKeywords)]; // Remove duplicates
}

// Function to download a file from a URL with redirect handling
async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Handle relative URLs by converting them to absolute URLs
    let absoluteUrl = url;
    if (url.startsWith('/')) {
      // If it's a relative URL, try to determine the base URL
      // For loremflickr, the base URL is https://loremflickr.com
      if (url.includes('loremflickr') || url.includes('cache/resized')) {
        absoluteUrl = `https://loremflickr.com${url}`;
      } else {
        // For other relative URLs, we'll skip them as we can't determine the base
        console.log(`Skipping relative URL: ${url}`);
        reject(new Error(`Relative URL cannot be resolved: ${url}`));
        return;
      }
    }
    
    // Ensure the directory exists
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const file = fs.createWriteStream(dest);
    const protocol = absoluteUrl.startsWith('https') ? https : http;
    
    const request = protocol.get(absoluteUrl, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          console.log(`Redirecting to: ${redirectUrl}`);
          file.close(() => {
            fs.unlink(dest, () => {}); // Delete the file async
            downloadFile(redirectUrl, dest).then(resolve).catch(reject);
          });
          return;
        }
      }
      
      // Check if response is successful
      if (response.statusCode !== 200) {
        file.close(() => {
          fs.unlink(dest, () => {}); // Delete the file async
          reject(new Error(`Failed to download file: ${response.statusCode}`));
        });
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    
    request.on('error', (err) => {
      file.close(() => {
        try {
          fs.unlinkSync(dest); // Delete the file sync to avoid async issues
        } catch (unlinkErr) {
          // Ignore unlink errors
        }
        reject(err);
      });
    });
    
    // Handle file stream errors
    file.on('error', (err) => {
      request.destroy();
      try {
        fs.unlinkSync(dest); // Delete the file sync to avoid async issues
      } catch (unlinkErr) {
        // Ignore unlink errors
      }
      reject(err);
    });
  });
}

// Enhanced image search that uses multiple APIs for better relevance
export async function searchImages(keywords: string[], maxImages: number = 10): Promise<string[]> {
  try {
    console.log(`Searching for relevant images with keywords:`, keywords);
    
    // If Google Custom Search API is available, use it for better image search
    if (googleSearch && googleSearchEngineId) {
      console.log("Using Google Custom Search API for image search");
      const imageUrls: string[] = [];
      
      // Create search queries based on keywords
      const searchQueries: string[] = [];
      
      // Add direct keywords with modifiers for better targeting
      for (const keyword of keywords) {
        searchQueries.push(keyword);
        // More specific terms for concrete imagery
        searchQueries.push(`${keyword} example`);
        searchQueries.push(`${keyword} demonstration`);
        searchQueries.push(`${keyword} workspace`);
        searchQueries.push(`${keyword} interface`);
        searchQueries.push(`${keyword} screenshot`);
        searchQueries.push(`${keyword} code`);
        searchQueries.push(`${keyword} project`);
      }
      
      // Add highly specific contextual queries based on detected keywords
      const hasProgramming = keywords.some(k => 
        ['python', 'javascript', 'java', 'cpp', 'csharp', 'typescript'].includes(k)
      );
      
      const hasWebTech = keywords.some(k => 
        ['react', 'angular', 'vuejs', 'html', 'css', 'nextjs'].includes(k)
      );
      
      const hasDataTech = keywords.some(k => 
        ['sql', 'pandas', 'numpy', 'tableau', 'power-bi', 'excel'].includes(k)
      );
      
      const hasAiMl = keywords.some(k => 
        ['machine-learning', 'artificial-intelligence', 'computer-vision', 'nlp', 'deep-learning'].includes(k)
      );
      
      if (hasProgramming) {
        searchQueries.push('python code editor', 'javascript development', 'programming IDE', 'coding workspace');
        searchQueries.push('python script', 'javascript application', 'code snippet', 'programming project');
      }
      
      if (hasWebTech) {
        searchQueries.push('react component', 'web application interface', 'html css design', 'frontend development');
        searchQueries.push('website dashboard', 'user interface design', 'web development project');
      }
      
      if (hasDataTech) {
        searchQueries.push('sql database query', 'pandas data analysis', 'tableau dashboard', 'excel spreadsheet');
        searchQueries.push('data visualization chart', 'business intelligence report', 'analytics dashboard');
      }
      
      if (hasAiMl) {
        searchQueries.push('machine learning model', 'neural network diagram', 'ai algorithm', 'computer vision');
        searchQueries.push('data science project', 'artificial intelligence application', 'ml pipeline');
      }
      
      if (keywords.includes('education')) {
        searchQueries.push('university campus', 'academic research', 'student learning', 'educational institution');
      }
      
      if (keywords.includes('developer') || keywords.includes('engineer')) {
        searchQueries.push('software engineer workspace', 'developer coding', 'engineering project', 'technical team');
      }
      
      // Remove duplicates and limit queries
      const uniqueQueries = [...new Set(searchQueries)].slice(0, 20);
      console.log("Using search queries:", uniqueQueries);
      
      // Search for images using Google Custom Search API
      for (const query of uniqueQueries) {
        try {
          const result = await googleSearch.cse.list({
            auth: process.env.GOOGLE_API_KEY,
            cx: googleSearchEngineId,
            q: query,
            searchType: 'image',
            num: 3, // Number of results per query
          });
          
          if (result.data && result.data.items) {
            for (const item of result.data.items) {
              if (item.link && imageUrls.length < maxImages * 2) {
                imageUrls.push(item.link);
              }
            }
          }
        } catch (error) {
          console.error(`Error searching for images with query "${query}":`, error);
        }
      }
      
      if (imageUrls.length > 0) {
        console.log(`Found ${imageUrls.length} relevant images using Google Custom Search API`);
        return [...new Set(imageUrls)].slice(0, maxImages * 2); // Remove duplicates and limit
      }
      
      // If Google search failed, try Unsplash
      console.log("Google Custom Search returned no results, trying Unsplash");
    }
    
    // If Unsplash API is available, use it for better image search
    if (unsplash) {
      console.log("Using Unsplash API for image search");
      const imageUrls: string[] = [];
      
      // Create search queries based on keywords
      const searchQueries: string[] = [];
      
      // Add direct keywords with modifiers for better targeting
      for (const keyword of keywords) {
        searchQueries.push(keyword);
        // More specific terms for concrete imagery
        searchQueries.push(`${keyword} example`);
        searchQueries.push(`${keyword} demonstration`);
        searchQueries.push(`${keyword} workspace`);
        searchQueries.push(`${keyword} interface`);
        searchQueries.push(`${keyword} screenshot`);
        searchQueries.push(`${keyword} code`);
        searchQueries.push(`${keyword} project`);
      }
      
      // Add highly specific contextual queries based on detected keywords
      const hasProgramming = keywords.some(k => 
        ['python', 'javascript', 'java', 'cpp', 'csharp', 'typescript'].includes(k)
      );
      
      const hasWebTech = keywords.some(k => 
        ['react', 'angular', 'vuejs', 'html', 'css', 'nextjs'].includes(k)
      );
      
      const hasDataTech = keywords.some(k => 
        ['sql', 'pandas', 'numpy', 'tableau', 'power-bi', 'excel'].includes(k)
      );
      
      const hasAiMl = keywords.some(k => 
        ['machine-learning', 'artificial-intelligence', 'computer-vision', 'nlp', 'deep-learning'].includes(k)
      );
      
      if (hasProgramming) {
        searchQueries.push('python code editor', 'javascript development', 'programming IDE', 'coding workspace');
        searchQueries.push('python script', 'javascript application', 'code snippet', 'programming project');
      }
      
      if (hasWebTech) {
        searchQueries.push('react component', 'web application interface', 'html css design', 'frontend development');
        searchQueries.push('website dashboard', 'user interface design', 'web development project');
      }
      
      if (hasDataTech) {
        searchQueries.push('sql database query', 'pandas data analysis', 'tableau dashboard', 'excel spreadsheet');
        searchQueries.push('data visualization chart', 'business intelligence report', 'analytics dashboard');
      }
      
      if (hasAiMl) {
        searchQueries.push('machine learning model', 'neural network diagram', 'ai algorithm', 'computer vision');
        searchQueries.push('data science project', 'artificial intelligence application', 'ml pipeline');
      }
      
      if (keywords.includes('education')) {
        searchQueries.push('university campus', 'academic research', 'student learning', 'educational institution');
      }
      
      if (keywords.includes('developer') || keywords.includes('engineer')) {
        searchQueries.push('software engineer workspace', 'developer coding', 'engineering project', 'technical team');
      }
      
      // Remove duplicates and limit queries
      const uniqueQueries = [...new Set(searchQueries)].slice(0, 20);
      console.log("Using search queries:", uniqueQueries);
      
      // Search for images using Unsplash API
      for (const query of uniqueQueries) {
        try {
          const result = await unsplash.search.getPhotos({
            query: query,
            perPage: 3,
            orientation: 'landscape',
          });
          
          if (result.response && result.response.results) {
            for (const photo of result.response.results) {
              if (imageUrls.length < maxImages * 2) {
                // Use the regular size URL for better quality
                imageUrls.push(photo.urls.regular);
              }
            }
          }
        } catch (error) {
          console.error(`Error searching for images with query "${query}":`, error);
        }
      }
      
      if (imageUrls.length > 0) {
        console.log(`Found ${imageUrls.length} relevant images using Unsplash API`);
        return [...new Set(imageUrls)].slice(0, maxImages * 2); // Remove duplicates and limit
      }
      
      // If Unsplash search failed, fall back to the original method
      console.log("Unsplash search returned no results, falling back to original method");
    } else {
      console.log("Unsplash API key not configured, using original image search method");
    }
    
    // Original image search method (fallback)
    // Create more specific search queries based on content
    const searchQueries: string[] = [];
    
    // Add direct keywords with modifiers for better targeting
    for (const keyword of keywords) {
      searchQueries.push(keyword);
      // More specific terms for concrete imagery
      searchQueries.push(`${keyword} example`);
      searchQueries.push(`${keyword} demonstration`);
      searchQueries.push(`${keyword} tutorial`);
      searchQueries.push(`${keyword} workspace`);
      searchQueries.push(`${keyword} interface`);
      searchQueries.push(`${keyword} screenshot`);
      searchQueries.push(`${keyword} code`);
      searchQueries.push(`${keyword} project`);
    }
    
    // Add highly specific contextual queries based on detected keywords
    const hasProgramming = keywords.some(k => 
      ['python', 'javascript', 'java', 'cpp', 'csharp', 'typescript'].includes(k)
    );
    
    const hasWebTech = keywords.some(k => 
      ['react', 'angular', 'vuejs', 'html', 'css', 'nextjs'].includes(k)
    );
    
    const hasDataTech = keywords.some(k => 
      ['sql', 'pandas', 'numpy', 'tableau', 'power-bi', 'excel'].includes(k)
    );
    
    const hasAiMl = keywords.some(k => 
      ['machine-learning', 'artificial-intelligence', 'computer-vision', 'nlp', 'deep-learning'].includes(k)
    );
    
    if (hasProgramming) {
      searchQueries.push('python code editor', 'javascript development', 'programming IDE', 'coding workspace');
      searchQueries.push('python script', 'javascript application', 'code snippet', 'programming project');
    }
    
    if (hasWebTech) {
      searchQueries.push('react component', 'web application interface', 'html css design', 'frontend development');
      searchQueries.push('website dashboard', 'user interface design', 'web development project');
    }
    
    if (hasDataTech) {
      searchQueries.push('sql database query', 'pandas data analysis', 'tableau dashboard', 'excel spreadsheet');
      searchQueries.push('data visualization chart', 'business intelligence report', 'analytics dashboard');
    }
    
    if (hasAiMl) {
      searchQueries.push('machine learning model', 'neural network diagram', 'ai algorithm', 'computer vision');
      searchQueries.push('data science project', 'artificial intelligence application', 'ml pipeline');
    }
    
    if (keywords.includes('education')) {
      searchQueries.push('university campus', 'academic research', 'student learning', 'educational institution');
    }
    
    if (keywords.includes('developer') || keywords.includes('engineer')) {
      searchQueries.push('software engineer workspace', 'developer coding', 'engineering project', 'technical team');
    }
    
    // Remove duplicates and limit queries
    const uniqueQueries = [...new Set(searchQueries)].slice(0, 40);
    console.log("Using search queries:", uniqueQueries);
    
    // Generate URLs from multiple image sources for better coverage
    const imageUrls: string[] = [];
    const width = 1920;
    const height = 1080;
    
    // Strategy 1: Picsum photos with specific terms first
    for (const query of uniqueQueries.slice(0, 15)) {
      const encodedQuery = encodeURIComponent(query.replace(/\s+/g, '-'));
      const service = `https://picsum.photos/seed/${encodedQuery}/${width}/${height}`;
      
      if (imageUrls.length < maxImages * 3) {
        imageUrls.push(service);
      }
    }
    
    // Strategy 2: Loremflickr with specific terms
    for (const query of uniqueQueries.slice(0, 20)) {
      const encodedQuery = encodeURIComponent(query.replace(/\s+/g, ','));
      const service = `https://loremflickr.com/${width}/${height}/${encodedQuery}?random=${Date.now()}`;
      
      if (imageUrls.length < maxImages * 3) {
        imageUrls.push(service);
      }
    }
    
    // Strategy 3: Individual keyword searches with very specific terms
    const individualKeywords = [...new Set(keywords)].slice(0, 20);
    for (const keyword of individualKeywords) {
      const variations = [
        `${keyword} example`,
        `${keyword} demonstration`,
        `${keyword} workspace`,
        `${keyword} interface`,
        `${keyword} screenshot`,
        `${keyword} code`,
        `${keyword} project`,
        `${keyword} application`
      ];
      
      for (const variation of variations) {
        if (imageUrls.length < maxImages * 3) {
          const encodedVariation = encodeURIComponent(variation.replace(/\s+/g, '-'));
          const services = [
            `https://picsum.photos/seed/${encodedVariation}/${width}/${height}`,
            `https://loremflickr.com/${width}/${height}/${encodedVariation.replace(/-/g, ',')}?random=${Date.now()}`
          ];
          
          for (const service of services) {
            if (imageUrls.length < maxImages * 3) {
              imageUrls.push(service);
            }
          }
        }
      }
    }
    
    console.log(`Generated ${imageUrls.length} targeted image URLs using specific search strategies`);
    return [...new Set(imageUrls)].slice(0, maxImages * 3); // Remove duplicates and limit
  } catch (error) {
    console.error('Image search error:', error);
    return [];
  }
}

// Download images and add text overlays
export async function generateRelevantImages(keywords: string[], outputDir: string, count: number = 10): Promise<string[]> {
  try {
    console.log(`Generating ${count} relevant images with text overlays for resume content`);
    
    // Ensure output directory exists with proper permissions
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const imagePaths: string[] = [];
    const width = 1920;
    const height = 1080;
    
    // First, search for and download relevant background images
    const imageUrls = await searchImages(keywords, count * 3);
    console.log(`Found ${imageUrls.length} candidate images`);
    
    // Download background images with better error handling
    const downloadedImages = [];
    let downloadCount = 0;
    
    for (let i = 0; i < imageUrls.length && downloadCount < count * 2; i++) {
      try {
        const url = imageUrls[i];
        const filename = `background_${Date.now()}_${downloadCount}.jpg`;
        const filepath = path.join(outputDir, filename);
        
        // Check if we can write to the directory
        try {
          await downloadFile(url, filepath);
          
          // Verify the file was downloaded and is a valid image
          if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
            downloadedImages.push(filepath);
            downloadCount++;
            console.log(`Downloaded image: ${filepath}`);
          } else {
            // Clean up invalid file
            if (fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
            }
          }
        } catch (permissionError) {
          console.error(`Permission error for ${filepath}, trying alternative location:`, permissionError);
          // Try a different location if OneDrive is causing issues
          const altDir = path.join(process.cwd(), 'temp_alt', 'images');
          if (!fs.existsSync(altDir)) {
            fs.mkdirSync(altDir, { recursive: true });
          }
          const altFilepath = path.join(altDir, filename);
          await downloadFile(url, altFilepath);
          
          // Verify the file was downloaded and is a valid image
          if (fs.existsSync(altFilepath) && fs.statSync(altFilepath).size > 0) {
            downloadedImages.push(altFilepath);
            downloadCount++;
            console.log(`Downloaded image to alternative location: ${altFilepath}`);
          } else {
            // Clean up invalid file
            if (fs.existsSync(altFilepath)) {
              fs.unlinkSync(altFilepath);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to download image ${i}:`, error);
      }
    }
    
    console.log(`Successfully downloaded ${downloadedImages.length} images`);
    
    // If we couldn't download enough images, create some fallback images
    if (downloadedImages.length < count) {
      console.log("Not enough images downloaded, creating fallback images");
      const fallbackCount = count - downloadedImages.length;
      
      for (let i = 0; i < fallbackCount; i++) {
        try {
          const filename = `fallback_${Date.now()}_${i}.png`;
          const filepath = path.join(outputDir, filename);
          
          // Create a professional-themed background
          let backgroundColor = 'blue';
          if (i % 5 === 1) backgroundColor = 'navy';
          if (i % 5 === 2) backgroundColor = 'darkgreen';
          if (i % 5 === 3) backgroundColor = 'purple';
          if (i % 5 === 4) backgroundColor = 'teal';
          
          const bgCommand = `ffmpeg -y -f lavfi -i color=${backgroundColor}:s=${width}x${height} -frames:v 1 -pix_fmt rgb24 "${filepath}"`;
          await exec(bgCommand);
          
          downloadedImages.push(filepath);
          console.log(`Created fallback image: ${filepath}`);
        } catch (error) {
          console.error(`Failed to create fallback image ${i}:`, error);
        }
      }
    }
    
    // Define empty text overlays to avoid showing any text on images
    const textOverlays: string[] = [];
    
    // No text overlays - keep the array empty
    // This ensures no text is displayed on the generated images
    
    console.log("Using no text overlays to avoid displaying any text on images");
    
    // Apply images without any text overlays
    for (let i = 0; i < Math.min(count, downloadedImages.length); i++) {
      const imagePath = downloadedImages[i];
      
      const filename = `final_image_${Date.now()}_${i}.png`;
      const outputPath = path.join(outputDir, filename);
      
      try {
        // Apply images without any text overlays
        const command = `ffmpeg -y -i "${imagePath}" -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1" -frames:v 1 -update 1 -pix_fmt rgb24 "${outputPath}"`;
        
        console.log(`Applying image without text overlay`);
        await exec(command);
        imagePaths.push(outputPath);
        console.log(`Generated image without text overlay: ${outputPath}`);
      } catch (error) {
        console.error(`Failed to process image without text overlay ${i}:`, error);
      }
    }
    
    // If we need more images, create some without any text
    if (imagePaths.length < count) {
      const remaining = count - imagePaths.length;
      for (let i = 0; i < remaining; i++) {
        const filename = `custom_image_${Date.now()}_${i}.png`;
        const outputPath = path.join(outputDir, filename);
        
        try {
          // Create a professional-themed image without any text
          let backgroundColor = 'blue';
          if (i % 5 === 1) backgroundColor = 'navy';
          if (i % 5 === 2) backgroundColor = 'darkgreen';
          if (i % 5 === 3) backgroundColor = 'purple';
          if (i % 5 === 4) backgroundColor = 'teal';
          
          const command = `ffmpeg -y -f lavfi -i color=${backgroundColor}:s=${width}x${height} -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1" -frames:v 1 -update 1 -pix_fmt rgb24 "${outputPath}"`;
          
          await exec(command);
          imagePaths.push(outputPath);
          console.log(`Generated custom image without text overlay: ${outputPath}`);
        } catch (error) {
          console.error(`Failed to generate custom image without text overlay:`, error);
        }
      }
    }
    
    console.log(`Generated ${imagePaths.length} relevant images without text overlays`);
    return imagePaths;
  } catch (error) {
    console.error('Image generation error:', error);
    return [];
  }
}

// Download images from URLs
export async function downloadImages(imageUrls: string[], downloadDir: string, maxImages: number = 10): Promise<string[]> {
  try {
    // Ensure download directory exists
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    const downloadedPaths: string[] = [];
    
    // Download up to maxImages images
    for (let i = 0; i < imageUrls.length && downloadedPaths.length < maxImages; i++) {
      const url = imageUrls[i];
      const filename = `downloaded_image_${Date.now()}_${i}.jpg`;
      const filepath = path.join(downloadDir, filename);
      
      try {
        await downloadFile(url, filepath);
        
        // Verify the file was downloaded and is a valid image
        if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
          downloadedPaths.push(filepath);
          console.log(`Downloaded image: ${filepath}`);
        } else {
          // Clean up invalid file
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }
      } catch (error) {
        console.error(`Failed to download image from ${url}:`, error);
        // Continue with next image
      }
    }
    
    return downloadedPaths;
  } catch (error) {
    console.error('Image download error:', error);
    return [];
  }
}

// Modified slideshow function that can work with generated images
export async function createSlideshowFromImages(
  imagePaths: string[], 
  audioPath: string, 
  outputPath: string,
  duration: number
): Promise<string> {
  try {
    if (imagePaths.length === 0) {
      throw new Error('No images provided for slideshow');
    }
    
    console.log(`Creating slideshow with ${imagePaths.length} generated images`);
    console.log(`Audio path: ${audioPath}`);
    console.log(`Output path: ${outputPath}`);
    console.log(`Duration: ${duration} seconds`);
    
    // Calculate duration per image
    const imageDuration = Math.max(2, Math.floor(duration / imagePaths.length));
    
    // Create a text file with the list of images for ffmpeg
    const imageListPath = path.join(path.dirname(outputPath), 'image_list.txt');
    
    // Create content for the image list file
    let imageListContent = '';
    for (const imagePath of imagePaths) {
      imageListContent += `file '${imagePath.replace(/\\/g, '/').replace(/'/g, "\\'")}'\n`;
      imageListContent += `duration ${imageDuration}\n`;
    }
    
    // Repeat the last image to fill the remaining duration
    if (imagePaths.length > 0) {
      const lastImagePath = imagePaths[imagePaths.length - 1];
      const remainingDuration = duration - (imageDuration * imagePaths.length);
      if (remainingDuration > 0) {
        imageListContent += `file '${lastImagePath.replace(/\\/g, '/').replace(/'/g, "\\'")}'\n`;
        imageListContent += `duration ${remainingDuration}\n`;
      }
    }
    
    fs.writeFileSync(imageListPath, imageListContent);
    
    // Use ffmpeg to create the slideshow with audio
    // -f concat -safe 0 -i image_list.txt: reads the list of images
    // -i audio.mp3: adds the audio track
    // -vf fps=25: sets the frame rate
    // -c:v libx264: uses H.264 video codec
    // -c:a aac: uses AAC audio codec
    // -b:a 192k: sets audio bitrate
    // -shortest: makes the video as long as the shortest input (audio)
    const command = `ffmpeg -y -f concat -safe 0 -i "${imageListPath}" -i "${audioPath}" -vf "fps=25,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1" -c:v libx264 -c:a aac -b:a 192k -shortest -pix_fmt yuv420p "${outputPath}"`;
    
    console.log('Executing ffmpeg command:', command);
    await exec(command);
    
    // Clean up the image list file
    try {
      fs.unlinkSync(imageListPath);
    } catch (error) {
      console.warn('Failed to clean up image list file:', error);
    }
    
    return outputPath;
  } catch (error) {
    console.error('Slideshow creation error:', error);
    throw error;
  }
}