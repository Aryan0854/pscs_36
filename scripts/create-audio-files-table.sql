-- Create audio files table to store uploaded audio files
CREATE TABLE IF NOT EXISTS public.audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  audio_type TEXT NOT NULL CHECK (audio_type IN ('dialogue', 'voiceover', 'music', 'sfx', 'transitions')),
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  duration INTEGER, -- in seconds, nullable until calculated
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.audio_files ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own audio files
CREATE POLICY "Users can read own audio files" ON public.audio_files
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own audio files
CREATE POLICY "Users can insert own audio files" ON public.audio_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own audio files
CREATE POLICY "Users can update own audio files" ON public.audio_files
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own audio files
CREATE POLICY "Users can delete own audio files" ON public.audio_files
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_audio_files_user_id ON public.audio_files(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_audio_type ON public.audio_files(audio_type);
CREATE INDEX IF NOT EXISTS idx_audio_files_created_at ON public.audio_files(created_at DESC);