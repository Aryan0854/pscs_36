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
  const isSaving = useRef(false)

  useEffect(() => {
    if (!enabled || isSaving.current) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const hasChanged = JSON.stringify(data) !== JSON.stringify(lastSavedData.current)

    if (hasChanged && data && Object.keys(data).length > 0) {
      timeoutRef.current = setTimeout(async () => {
        isSaving.current = true
        try {
          await onSave(data)
          lastSavedData.current = structuredClone(data)
          toast({
            title: "Auto-saved",
            description: "Your changes have been automatically saved.",
            duration: 2000,
          })
        } catch (error) {
          console.error("Auto-save error:", error)
          toast({
            title: "Auto-save Failed",
            description: "Failed to save changes automatically. Please save manually.",
            variant: "destructive",
          })
        } finally {
          isSaving.current = false
        }
      }, interval)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, onSave, enabled, interval, toast])

  return { isSaving: isSaving.current }
}
