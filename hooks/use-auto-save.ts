"use client"

import { useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"

interface AutoSaveOptions {
  data: any
  onSave: (data: any) => Promise<void>
  enabled: boolean
  interval?: number
}

export function useAutoSave({ data, onSave, enabled, interval = 30000 }: AutoSaveOptions) {
  const { toast } = useToast()
  const lastSavedData = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!enabled) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Check if data has changed
    const hasChanged = JSON.stringify(data) !== JSON.stringify(lastSavedData.current)

    if (hasChanged && data) {
      timeoutRef.current = setTimeout(async () => {
        try {
          await onSave(data)
          lastSavedData.current = data
          toast({
            title: "Auto-saved",
            description: "Your changes have been automatically saved.",
          })
        } catch (error) {
          toast({
            title: "Auto-save Failed",
            description: "Failed to save changes automatically.",
            variant: "destructive",
          })
        }
      }, interval)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, onSave, enabled, interval, toast])
}
