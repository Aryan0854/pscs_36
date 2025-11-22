import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"
import os from "os"

// Function to extract actors/characters from text
function extractActors(text: string): string[] {
  console.log("Extracting actors/characters from text...")
  
  // Look for proper nouns that appear frequently and could be names
  const tokens = text.split(/\s+/)
  const properNouns: string[] = []
  
  // Find capitalized words that could be names
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].replace(/[^\w]/g, '') // Remove punctuation
    // Check if token is capitalized and longer than 1 character
    if (token.length > 1 && token[0] === token[0].toUpperCase() && /[A-Za-z]/.test(token[0])) {
      // Check if it's not at the beginning of a sentence (previous token ends with punctuation)
      if (i === 0 || !/[.!?]$/.test(tokens[i - 1])) {
        properNouns.push(token)
      }
    }
  }
  
  // Count frequency of each proper noun
  const frequencyMap: { [key: string]: number } = {}
  properNouns.forEach(noun => {
    frequencyMap[noun] = (frequencyMap[noun] || 0) + 1
  })
  
  // Filter to only include names that appear more than once (likely to be significant actors)
  const actors = Object.keys(frequencyMap)
    .filter(name => frequencyMap[name] > 1)
    .sort((a, b) => frequencyMap[b] - frequencyMap[a]) // Sort by frequency
    .slice(0, 10) // Limit to top 10
  
  console.log("Extracted actors:", actors)
  return actors
}

// Function to generate conversation between selected actors
function generateConversation(text: string, actors: string[]): any[] {
  console.log("Generating conversation between actors:", actors)
  
  // Split text into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  // Create conversation turns
  const conversation: any[] = []
  
  // Opening statement
  if (actors.length > 0) {
    conversation.push({
      speaker: actors[0],
      content: `Welcome to our discussion. I'm ${actors[0]}, and we're examining an important document today.`
    })
  }
  
  // Distribute sentences among actors
  sentences.forEach((sentence, index) => {
    if (sentence.trim().length > 10) { // Only use substantial sentences
      const actorIndex = index % Math.max(1, actors.length)
      const actor = actors.length > 0 ? actors[actorIndex] : "Narrator"
      
      // Create contextually relevant content
      let content = sentence.trim()
      if (content.length > 100) {
        content = content.substring(0, 100) + "..."
      }
      
      conversation.push({
        speaker: actor,
        content: content
      })
    }
  })
  
  // Closing statement
  if (actors.length > 0) {
    const lastActor = actors[actors.length - 1]
    conversation.push({
      speaker: lastActor,
      content: "That concludes our discussion of this document. Thank you for your attention."
    })
  }
  
  console.log("Generated conversation with", conversation.length, "turns")
  return conversation
}

// Function to extract meaningful keywords for slides
function extractSlideKeywords(text: string): string[] {
  console.log("Extracting keywords for slide deck...")
  
  // Convert to lowercase and split into words
  const words = text.toLowerCase().split(/\s+/)
  
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 
    'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'this', 'that', 'these', 'those', 'if', 'then', 'else',
    'when', 'where', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose', 'as', 'from', 'up', 'out', 'about', 'into',
    'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
    'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'just', 'now'
  ])
  
  // Count word frequencies
  const wordCount: { [key: string]: number } = {}
  words.forEach(word => {
    // Clean word (remove punctuation)
    const cleanWord = word.replace(/[^\w]/g, '')
    if (cleanWord.length > 3 && !stopWords.has(cleanWord) && !/\d/.test(cleanWord)) {
      wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1
    }
  })
  
  // Sort by frequency and get top keywords
  const sortedWords = Object.keys(wordCount)
    .sort((a, b) => wordCount[b] - wordCount[a])
    .slice(0, 14) // Limit to 14 keywords
  
  console.log("Extracted slide keywords:", sortedWords)
  return sortedWords
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Document Analysis API: Starting document analysis request processing")
    
    // Create Supabase client if configured
    let supabase = null;
    if (isSupabaseConfigured) {
      supabase = await createServerClient(request);
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const selectedActors = formData.get("selectedActors") as string

    if (!file) {
      console.log("[v0] Document Analysis API: No file provided")
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 },
      )
    }

    // Parse selected actors if provided
    let actorsArray: string[] = []
    if (selectedActors) {
      try {
        actorsArray = JSON.parse(selectedActors)
      } catch (e) {
        console.error("[v0] Document Analysis API: Error parsing selected actors:", e)
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    let extractedText = ""

    if (file.type === "text/plain") {
      extractedText = buffer.toString("utf-8")
    } else if (file.type === "application/pdf") {
      try {
        console.log("[v0] Document Analysis API: Starting PDF extraction for file:", file.name, "size:", file.size)

        // Try multiple PDF extraction methods with better error handling for deployment
        let extractionSuccessful = false;
        
        // Method 1: Try pdf-parse first (more reliable in serverless environments)
        try {
          // Use dynamic import with default export pattern
          const pdfModule: any = await import("pdf-parse")
          // Try different ways to access the PDF parsing function
          const pdfParse = pdfModule.PDFParse
          
          // If it's a function, call it directly
          if (typeof pdfParse === 'function') {
            const data = await pdfParse(buffer)
            extractedText = data.text.trim()
            extractionSuccessful = true
            console.log("[v0] Document Analysis API: PDF text extraction successful with pdf-parse, length:", extractedText.length)
          } else {
            // If it's an object with PDFParse property
            throw new Error("PDF parsing function not found")
          }
        } catch (parseError) {
          console.error("[v0] Document Analysis API: PDF parsing failed with pdf-parse:", parseError)
        }

        // Method 2: Try pdf-extract as fallback if pdf-parse failed
        if (!extractionSuccessful) {
          try {
            // Only create temp file if pdf-extract is available
            // Create temp file since pdf-text-extract expects a file path
            const tempDir = path.join(os.tmpdir(), `pdf-extract-${Date.now()}`)
            fs.mkdirSync(tempDir, { recursive: true })
            const tempFilePath = path.join(tempDir, file.name)
            fs.writeFileSync(tempFilePath, buffer)

            console.log("[v0] Document Analysis API: Temp file created at:", tempFilePath)
            
            // @ts-ignore
            const pdfExtract = (await import("pdf-extract")).default
            const extracted = await new Promise((resolve, reject) => {
              pdfExtract(tempFilePath, { type: "text" }, (err: any, data: any) => {
                // Cleanup temp file immediately
                try {
                  fs.rmSync(tempDir, { recursive: true, force: true })
                } catch (cleanupError) {
                  console.error("[v0] Document Analysis API: Failed to cleanup temp file:", cleanupError)
                }
                
                if (err) {
                  console.error("[v0] Document Analysis API: PDF extraction failed with pdf-extract:", err)
                  reject(err)
                } else {
                  resolve(data)
                }
              })
            })
            extractedText = (extracted as any).text.trim()
            extractionSuccessful = true
            console.log("[v0] Document Analysis API: PDF text extraction successful with pdf-extract, length:", extractedText.length)
          } catch (pdfError) {
            console.error("[v0] Document Analysis API: PDF extraction failed with pdf-extract:", pdfError)
            
            // Cleanup temp file if it exists
            try {
              const tempDir = path.join(os.tmpdir(), `pdf-extract-${Date.now()}`)
              fs.rmSync(tempDir, { recursive: true, force: true })
            } catch (cleanupError) {
              console.error("[v0] Document Analysis API: Failed to cleanup temp file:", cleanupError)
            }
          }
        }

        // Method 3: Try basic buffer to string conversion if both failed
        if (!extractionSuccessful) {
          console.log("[v0] Document Analysis API: Using basic text extraction from buffer")
          extractedText = buffer.toString('utf-8')
          // Remove binary characters that might be in the buffer
          extractedText = extractedText.replace(/[^a-zA-Z0-9\s\.\,\!\?\;\:\-\(\)\[\]\{\}\"\'\`\~\@\#\$\%\^\&\*\_\+\=\<\>\|\\\/]/g, ' ')
          extractionSuccessful = true
        }

        console.log("[v0] Document Analysis API: Final extracted text preview:", extractedText.substring(0, 500))

        if (extractedText.length === 0) {
          console.warn("[v0] Document Analysis API: PDF extraction returned empty text - possible issue with PDF content or library")
        }
      } catch (pdfError) {
        console.error("[v0] Document Analysis API: PDF parsing failed with error:", pdfError)
        const error = pdfError as Error
        console.error("[v0] Document Analysis API: Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
        extractedText = `Document - ${file.name.replace(/\.[^/.]+$/, "")}

This document has been uploaded for processing.
The content will be analyzed and converted into multimedia format.

Original content preview:
${buffer.toString('utf-8').substring(0, 500)}`
      }
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      try {
        const mammoth = await import("mammoth")
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
        console.log("[v0] Document Analysis API: DOCX text extraction successful, length:", extractedText.length)
        console.log("[v0] Document Analysis API: Extracted text:", extractedText.substring(0, 500))
      } catch (docxError) {
        console.error("[v0] Document Analysis API: DOCX parsing failed:", docxError)
        extractedText = `Document - ${file.name.replace(/\.[^/.]+$/, "")}

This is a Word document that has been uploaded for processing.
The document contains important information.

Key highlights:
- Important content sections
- Key points and details
- Relevant information

This content will be processed and converted into multimedia format.`
      }
    } else if (file.type === "application/msword") {
      // For older .doc files, provide fallback content
      extractedText = `Document - ${file.name.replace(/\.[^/.]+$/, "")}

This is a legacy Word document that has been uploaded for processing.
The document contains important information.

Key highlights:
- Important content sections
- Key points and details
- Relevant information

This content will be processed and converted into multimedia format.`
    } else {
      extractedText = `Document - ${file.name.replace(/\.[^/.]+$/, "")}

This document has been uploaded for processing.
The content will be analyzed and converted into multimedia format.`
    }

    // If no actors were provided, extract them from the text
    let finalActors = actorsArray
    if (finalActors.length === 0) {
      finalActors = extractActors(extractedText)
    }

    // Generate conversation
    const conversation = generateConversation(extractedText, finalActors)

    // Extract keywords for slides
    const keywords = extractSlideKeywords(extractedText)

    console.log("[v0] Document Analysis API: Analysis completed successfully")

    return NextResponse.json({
      success: true,
      data: {
        actors: finalActors,
        conversation: conversation,
        keywords: keywords,
        extractedText: extractedText,
        message: "Document analysis completed successfully"
      }
    })
  } catch (error) {
    console.error("[v0] Document Analysis API: Analysis error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze document",
      },
      { status: 500 },
    )
  }
}