"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FileText, Save, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ScriptEditorProps {
  extractedText: string
  onTextChange?: (text: string) => void
}

interface ScriptEditorProps {
  extractedText: string
  onTextChange?: (text: string) => void
  onTabChange?: (tab: string) => void
}

export function ScriptEditor({ extractedText, onTextChange, onTabChange }: ScriptEditorProps) {
  const [editedText, setEditedText] = useState(extractedText)
  const [showGenAudioButton, setShowGenAudioButton] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setEditedText(extractedText)
  }, [extractedText])

  const handleTextChange = (value: string) => {
    setEditedText(value)
    setShowGenAudioButton(false) // Hide button when text changes
    onTextChange?.(value)
  }

  const handleSave = () => {
    // Here you could save to database or local storage
    setShowGenAudioButton(true)
    toast({
      title: "Script Saved",
      description: "Your script changes have been saved successfully.",
    })
  }

  const handleReset = () => {
    setEditedText(extractedText)
    setShowGenAudioButton(false)
    toast({
      title: "Script Reset",
      description: "Script has been reset to the original extracted text.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Script Editor
        </CardTitle>
        <CardDescription>
          Edit the extracted text from your uploaded document. Changes will be reflected in scene generation and timeline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {editedText.length} characters
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
        <Textarea
          value={editedText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Extracted text will appear here..."
          className="min-h-[500px] resize-none font-mono text-sm"
        />
        {showGenAudioButton && (
          <div className="flex justify-center mt-4">
            <Button
              size="lg"
              className="font-semibold px-8 py-3"
              onClick={() => {
                onTabChange?.("gen-audio")
              }}
            >
              🎵 Gen Audio
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}