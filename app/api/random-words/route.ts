import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Function to extract random words from text
function extractRandomWords(text: string, count: number = 20): string[] {
  // Remove punctuation and split into words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3) // Only words with more than 3 characters
  
  // Remove common stop words
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 
    'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 
    'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'put', 'too', 'use', 'any', 'big', 'end', 
    'far', 'got', 'let', 'lot', 'run', 'set', 'say', 'she', 'try', 'way', 'win', 'yes', 'yet', 
    'bit', 'car', 'cut', 'eat', 'eye', 'few', 'fit', 'god', 'gun', 'hat', 'hit', 'job', 'law', 
    'lay', 'led', 'leg', 'let', 'lie', 'low', 'map', 'met', 'net', 'nor', 'off', 'oil', 'old', 
    'one', 'pay', 'per', 'put', 'red', 'rid', 'row', 'sat', 'saw', 'sea', 'set', 'sex', 'she', 
    'sky', 'sob', 'son', 'sun', 'ten', 'tip', 'top', 'toy', 'try', 'two', 'use', 'war', 'way', 
    'win', 'yes', 'yet', 'zoo'
  ])
  
  const filteredWords = words.filter(word => !stopWords.has(word))
  
  // Shuffle array and take first 'count' words
  const shuffled = [...filteredWords].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 }
      )
    }
    
    // Check if it's a text file
    if (file.type !== "text/plain") {
      return NextResponse.json(
        {
          success: false,
          error: "Only text files are supported",
        },
        { status: 400 }
      )
    }
    
    // Convert file to text
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const text = buffer.toString("utf-8")
    
    // Extract random words
    const randomWords = extractRandomWords(text, 20)
    
    return NextResponse.json({
      success: true,
      words: randomWords,
      message: "Random words extracted successfully"
    })
    
  } catch (error) {
    console.error("Random words extraction error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to extract random words",
      },
      { status: 500 }
    )
  }
}