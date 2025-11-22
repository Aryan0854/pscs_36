"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Play, Download, Upload, Loader2, Users, MessageCircle, Tags } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface Actor {
  id: string
  name: string
  selected: boolean
}

interface ConversationTurn {
  speaker: string
  content: string
}

interface DocumentAnalysisResult {
  actors: string[]
  conversation: ConversationTurn[]
  keywords: string[]
  extractedText: string
}

interface DocumentAnalyzerProps {
  onAnalysisComplete?: (result: DocumentAnalysisResult) => void
}

export default function DocumentAnalyzer({ onAnalysisComplete }: DocumentAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [actors, setActors] = useState<Actor[]>([])
  const [conversation, setConversation] = useState<ConversationTurn[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [extractedText, setExtractedText] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDocumentFile(file)
      setFileName(file.name)
    }
  }

  const handleActorSelection = (actorId: string) => {
    setActors(actors.map(actor => 
      actor.id === actorId ? { ...actor, selected: !actor.selected } : actor
    ))
  }

  const handleSelectAllActors = () => {
    setActors(actors.map(actor => ({ ...actor, selected: true })))
  }

  const handleDeselectAllActors = () => {
    setActors(actors.map(actor => ({ ...actor, selected: false })))
  }

  const handleAnalyze = async () => {
    if (!documentFile) {
      toast({
        title: "No Document",
        description: "Please select a document to analyze.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + 5
      })
    }, 300)

    try {
      const formData = new FormData()
      formData.append('file', documentFile)
      
      // Add selected actors if any
      const selectedActors = actors.filter(a => a.selected).map(a => a.name)
      if (selectedActors.length > 0) {
        formData.append('selectedActors', JSON.stringify(selectedActors))
      }

      const response = await fetch("/api/document-analysis", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setAnalysisProgress(100)
        
        // Process the results
        const resultActors: Actor[] = data.data.actors.map((actor: string, index: number) => ({
          id: `actor-${index}`,
          name: actor,
          selected: true
        }))
        
        setActors(resultActors)
        setConversation(data.data.conversation)
        setKeywords(data.data.keywords)
        setExtractedText(data.data.extractedText)
        
        if (onAnalysisComplete) {
          onAnalysisComplete({
            actors: data.data.actors,
            conversation: data.data.conversation,
            keywords: data.data.keywords,
            extractedText: data.data.extractedText
          })
        }
        
        toast({
          title: "Document Analysis Complete",
          description: `Identified ${data.data.actors.length} actors and ${data.data.keywords.length} keywords.`,
        })
      } else {
        toast({
          title: "Analysis Failed",
          description: data.error || "Failed to analyze document",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error analyzing document:", error)
      toast({
        title: "Analysis Error",
        description: "An error occurred while analyzing the document.",
        variant: "destructive",
      })
    } finally {
      clearInterval(interval)
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Document Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload
          </CardTitle>
          <CardDescription>
            Upload a document (PDF, DOCX, TXT) to analyze its content and extract actors and keywords
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-upload">Select Document</Label>
            <div className="flex gap-2">
              <Input
                id="document-upload"
                type="file"
                accept=".pdf,.docx,.txt,.doc"
                onChange={handleFileChange}
                className="flex-1"
              />
              {fileName && (
                <Badge variant="secondary" className="truncate max-w-xs">
                  {fileName}
                </Badge>
              )}
            </div>
          </div>
          
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !documentFile}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Document... {analysisProgress}%
              </>
            ) : (
              <>
                <MessageCircle className="mr-2 h-4 w-4" />
                Analyze Document
              </>
            )}
          </Button>
          
          {isAnalyzing && (
            <Progress value={analysisProgress} className="w-full" />
          )}
        </CardContent>
      </Card>

      {/* Actors Section */}
      {actors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Identified Actors/Characters
            </CardTitle>
            <CardDescription>
              Select which actors to include in the conversation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAllActors}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAllActors}>
                Deselect All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {actors.map((actor) => (
                <div key={actor.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                  <Checkbox
                    id={actor.id}
                    checked={actor.selected}
                    onCheckedChange={() => handleActorSelection(actor.id)}
                  />
                  <Label htmlFor={actor.id} className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {actor.name}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation Preview */}
      {conversation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Conversation</CardTitle>
            <CardDescription>
              Preview of the conversation between selected actors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-muted rounded-lg">
              {conversation.map((turn, index) => (
                <div key={index} className="space-y-1">
                  <div className="font-semibold text-primary">{turn.speaker}</div>
                  <div className="text-sm">{turn.content}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keywords Section */}
      {keywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Slide Deck Keywords
            </CardTitle>
            <CardDescription>
              Keywords extracted for slide titles and visual cues (8-14 keywords)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Text Preview */}
      {extractedText && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Document Text</CardTitle>
            <CardDescription>
              Preview of the text extracted from your document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={extractedText.substring(0, 1000) + (extractedText.length > 1000 ? "..." : "")}
              readOnly
              className="min-h-[200px]"
            />
            {extractedText.length > 1000 && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing first 1000 characters of {extractedText.length} total characters
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}