# Random Words Feature Documentation

## Overview

The Random Words feature allows users to enhance their video generation process by using random words extracted from a text file to search for relevant images. This provides more diverse and customizable visual content for videos.

## How It Works

1. User uploads a text file containing words or phrases
2. The system extracts random words from the file
3. These words are used as search terms to find relevant images
4. Images are downloaded and used to create a slideshow video
5. The number of images is dynamically adjusted based on the audio duration

## Implementation Details

### API Endpoint

The feature is implemented in the video generation API at `/api/video/generate`. When a `wordFile` parameter is provided, the system:

1. Extracts text from the uploaded file
2. Processes the text to identify meaningful words
3. Selects random words to use as image search terms
4. Searches for images using these terms
5. Downloads and processes the images into a slideshow

### Word Selection Algorithm

The word selection process:

1. Removes punctuation and splits text into individual words
2. Filters out words with 3 or fewer characters
3. Removes common stop words (the, and, for, etc.)
4. Randomly selects up to 15 words from the filtered list

### Image Processing

- Dynamically calculates the number of images needed based on audio duration (1 image per 3-5 seconds)
- Downloads multiple images per search term to ensure variety
- Limits the total number of images to between 3 and 15 for optimal performance
- Creates a slideshow with proper timing to match the audio duration

## Usage

### In the Video Generator Component

1. Navigate to the Video Generation tab
2. Complete the standard video generation fields (script, audio URL, etc.)
3. Optionally upload a text file using the "Word File" input
4. Click "Generate AI Video"

### Via Direct API Call

Send a POST request to `/api/video/generate` with the following FormData:

```javascript
const formData = new FormData();
formData.append('script', 'Your script text');
formData.append('dialogue', 'Your dialogue text');
formData.append('audioUrl', 'URL to audio file');
formData.append('style', 'news|documentary|educational|corporate');
formData.append('resolution', '720p|1080p|4k');
formData.append('projectId', 'Optional project ID');
formData.append('wordFile', file); // Optional word file
```

## Testing

A test page is available at `/test-random-words` that provides a simple interface for testing the feature:

1. Enter script text
2. Provide an audio URL
3. Optionally upload a word file
4. Click "Generate Video"

A sample word file is available at `/samples/sample_words.txt` for testing purposes.

## Benefits

- **Enhanced Visual Diversity**: Using random words from a custom file provides more varied imagery than script-based keywords
- **Customizable Content**: Users can guide the visual theme by providing relevant word files
- **Dynamic Image Count**: Automatically adjusts the number of images based on video duration
- **Fallback Protection**: If image processing fails, the system falls back to the standard caption-based video generation

## Technical Considerations

- The system downloads up to 2x the needed number of images to ensure quality and variety
- Images are sized to 1920x1080 for consistent video quality
- Processing time may increase with larger word files or longer audio durations
- All temporary files are automatically cleaned up after processing