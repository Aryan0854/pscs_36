import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { extractKeywords, searchImages, downloadImages, createSlideshowFromImages, generateRelevantImages } from '@/lib/utils/web-search';
import { createClient } from '@/lib/supabase/server';

const exec = promisify(execCallback);

// New function to create a video with downloaded images
async function createVideoWithImages(tempDir: string, videoId: string, script: string, audioPath: string, style: string, resolution: string, duration: number, wordFile: File | null = null): Promise<string> {
  try {
    console.log("Starting improved video generation with relevant images");
    
    // Extract keywords from the script with enhanced relevance for resumes
    const keywords = extractKeywords(script);
    console.log("Extracted resume keywords:", keywords);
    
    // Check if a word file is provided
    let imageSearchKeywords = keywords;
    
    // If we have a word file, extract random words from it
    if (wordFile) {
      try {
        // Save the word file temporarily
        const wordFilePath = path.join(tempDir, 'word_file.txt');
        const wordArrayBuffer = await wordFile.arrayBuffer();
        const wordBuffer = Buffer.from(wordArrayBuffer);
        fs.writeFileSync(wordFilePath, wordBuffer);
        
        // Extract text from the word file
        const wordFileText = wordBuffer.toString('utf-8');
        
        // Extract keywords from the word file
        const randomWords = extractKeywords(wordFileText);
        if (randomWords.length > 0) {
          imageSearchKeywords = randomWords;
          console.log("Using keywords from word file:", imageSearchKeywords);
        }
        
        // Clean up
        fs.unlinkSync(wordFilePath);
      } catch (error) {
        console.error("Error processing word file:", error);
      }
    }
    
    // Calculate number of images based on duration (1 image per 3-5 seconds)
    const numberOfImages = Math.max(3, Math.min(15, Math.floor(duration / 4)));
    console.log(`Targeting ${numberOfImages} relevant images for ${duration} seconds of video`);
    
    // Generate relevant images with text overlays on backgrounds
    const imageDownloadDir = path.join(tempDir, 'images');
    const generatedImagePaths = await generateRelevantImages(imageSearchKeywords, imageDownloadDir, numberOfImages);
    console.log(`Successfully generated ${generatedImagePaths.length} relevant images`);
    
    // Log improvement information
    if (generatedImagePaths.length > 0) {
      console.log(`🎯 Successfully generated images with content relevant to resume`);
      
      // Log specific content matches that were targeted
      const targetedContent = imageSearchKeywords.filter(k => 
        k.includes('license-plate') || 
        k.includes('medicinal-plant') || 
        k.includes('python') || 
        k.includes('machine-learning') ||
        k.includes('data') ||
        k.includes('web') ||
        k.includes('react') ||
        k.includes('tableau') ||
        k.includes('power-bi') ||
        k.includes('presidency')
      );
      
      if (targetedContent.length > 0) {
        console.log(`🎯 Generated images for content areas: ${targetedContent.join(', ')}`);
      }
    } else {
      console.log("⚠️  No relevant images generated, using fallback method");
      // Fallback to a simple video with just audio
      const videoPath = path.join(tempDir, `${videoId}.mp4`);
      
      // Create a simple background video
      const backgroundPath = path.join(tempDir, `${videoId}_background.png`);
      await createBackgroundImage(backgroundPath, style, resolution);
      
      // Create video from background image and audio
      console.log("Creating video from background image and audio");
      await exec(`ffmpeg -y -loop 1 -i "${backgroundPath}" -i "${audioPath}" -c:v libx264 -c:a aac -b:a 192k -t ${duration} -pix_fmt yuv420p "${videoPath}"`);
      
      // Clean up background image
      try {
        fs.unlinkSync(backgroundPath);
      } catch (e) {
        console.error('Failed to clean up background image:', e);
      }
      
      return videoPath;
    }
    
    // Create slideshow from generated images
    const videoPath = path.join(tempDir, `${videoId}_slideshow.mp4`);
    await createSlideshowFromImages(generatedImagePaths, audioPath, videoPath, duration);
    
    return videoPath;
  } catch (error) {
    console.error("Error creating video with relevant images:", error);
    // Fallback to a simple video with just audio
    const videoPath = path.join(tempDir, `${videoId}.mp4`);
    
    // Create a simple background video
    const backgroundPath = path.join(tempDir, `${videoId}_background.png`);
    await createBackgroundImage(backgroundPath, style, resolution);
    
    // Create video from background image and audio
    console.log("Creating video from background image and audio (fallback)");
    await exec(`ffmpeg -y -loop 1 -i "${backgroundPath}" -i "${audioPath}" -c:v libx264 -c:a aac -b:a 192k -t ${duration} -pix_fmt yuv420p "${videoPath}"`);
    
    // Clean up background image
    try {
      fs.unlinkSync(backgroundPath);
    } catch (e) {
      console.error('Failed to clean up background image:', e);
    }
    
    return videoPath;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Video generation API called")
    const formData = await request.formData()
    const script = formData.get('script') as string
    const dialogue = formData.get('dialogue') as string
    const audioUrl = formData.get('audioUrl') as string
    const style = formData.get('style') as string
    const resolution = formData.get('resolution') as string
    const projectId = formData.get('projectId') as string // Add project ID

    console.log("Script received:", script?.substring(0, 100) + "...")
    console.log("Dialogue received:", dialogue?.substring(0, 100) + "...")
    console.log("Audio URL:", audioUrl)
    console.log("Style:", style)
    console.log("Resolution:", resolution)
    console.log("Project ID:", projectId) // Log project ID

    if (!script || !script.trim()) {
      console.log("No script provided")
      return NextResponse.json({ error: 'No script provided' }, { status: 400 })
    }

    if (!audioUrl) {
      console.log("No audio URL provided")
      return NextResponse.json({ error: 'No audio URL provided' }, { status: 400 })
    }

    // Generate a unique ID for the video
    const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create temp directory for processing (use a location less likely to have permission issues)
    // Use the system temp directory instead of project directory to avoid OneDrive issues
    const tempDir = path.join(os.tmpdir(), 'video_generator', videoId)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Download audio file
    const audioPath = path.join(tempDir, `${videoId}_audio.mp3`)
    console.log("Downloading audio from:", audioUrl)

    // If audioUrl is relative, convert to full URL
    const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `${request.nextUrl.origin}${audioUrl}`

    const audioResponse = await fetch(fullAudioUrl)
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`)
    }
    const audioBuffer = await audioResponse.arrayBuffer()
    fs.writeFileSync(audioPath, Buffer.from(audioBuffer))

    // Get audio duration
    const { stdout: durationOutput } = await exec(`ffprobe -v quiet -print_format json -show_format "${audioPath}"`)
    const audioInfo = JSON.parse(durationOutput)
    const duration = Math.ceil(parseFloat(audioInfo.format.duration))

    // Use dialogue directly as the transcript
    let dialogueText = dialogue || script
    console.log("Using dialogue for captions:", dialogueText?.substring(0, 100) + "...")

    // If dialogue is JSON array, extract text
    try {
      const parsed = JSON.parse(dialogueText)
      if (Array.isArray(parsed)) {
        dialogueText = parsed.map((item: any) => typeof item === 'string' ? item : item.text || item).join(' ')
      }
    } catch (e) {
      // Not JSON, use as is
    }

    // ALWAYS use web search and images for video generation
    console.log("Creating video with web search and images")
    const wordFile = formData.get('wordFile') as File | null;
    const videoPath = await createVideoWithImages(tempDir, videoId, script, audioPath, style, resolution, duration, wordFile)

    // Create thumbnail
    const thumbnailPath = path.join(tempDir, `${videoId}_thumbnail.jpg`)
    await exec(`ffmpeg -y -i "${videoPath}" -vframes 1 -q:v 2 "${thumbnailPath}"`)

    // Move files to public directory
    const publicVideoDir = path.join(process.cwd(), 'public', 'generated', 'videos')
    const publicThumbnailDir = path.join(process.cwd(), 'public', 'generated', 'thumbnails')

    if (!fs.existsSync(publicVideoDir)) fs.mkdirSync(publicVideoDir, { recursive: true })
    if (!fs.existsSync(publicThumbnailDir)) fs.mkdirSync(publicThumbnailDir, { recursive: true })

    const finalVideoPath = path.join(publicVideoDir, `${videoId}.mp4`)
    const finalThumbnailPath = path.join(publicThumbnailDir, `${videoId}.jpg`)

    fs.renameSync(videoPath, finalVideoPath)
    fs.renameSync(thumbnailPath, finalThumbnailPath)

    // Clean up temp files
    try {
      fs.unlinkSync(audioPath)
      // Clean up the entire temp directory
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch (e) {
      console.error('Failed to clean up temp files:', e)
    }

    const videoUrl = `/api/video/download/${videoId}.mp4`
    const thumbnailUrl = `/api/video/thumbnail/${videoId}.jpg`

    // Save video URL to database if project ID is provided
    if (projectId) {
      try {
        const supabase = await createClient()
        const { error: updateError } = await supabase
          .from('projects')
          .update({ video_url: videoUrl })
          .eq('id', projectId)
        
        if (updateError) {
          console.error('Failed to update project with video URL:', updateError)
        } else {
          console.log('Successfully updated project with video URL:', projectId)
        }
      } catch (dbError) {
        console.error('Database error when saving video URL:', dbError)
      }
    }

    console.log("Video generation completed successfully")
    console.log("Video URL:", videoUrl)
    console.log("Thumbnail URL:", thumbnailUrl)
    console.log("Duration:", duration)

    return NextResponse.json({
      success: true,
      videoUrl,
      thumbnailUrl,
      duration,
      message: 'Video generated successfully'
    })

  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function createBackgroundImage(backgroundPath: string, style: string, resolution: string) {
  // Create a simple colored background based on style
  const colors = {
    news: '#1a365d', // Dark blue
    documentary: '#2d3748', // Dark gray
    educational: '#2b6cb0', // Blue
    corporate: '#1a202c' // Dark
  }

  const color = colors[style as keyof typeof colors] || '#1a365d'
  const resMap = { '720p': '1280x720', '1080p': '1920x1080', '4k': '3840x2160' }
  const res = resMap[resolution as keyof typeof resMap] || '1920x1080'

  await exec(`ffmpeg -y -f lavfi -i color=${color}:${res} -frames:v 1 -update 1 "${backgroundPath}"`)
}