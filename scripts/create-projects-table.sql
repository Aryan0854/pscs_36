-- Create projects table for storing uploaded documents and generated content
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  extracted_text TEXT,
  generated_script TEXT,
  audio_url TEXT,
  video_url TEXT,
  status TEXT DEFAULT 'processing',
  language_count INTEGER DEFAULT 0,
  scene_count INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create timeline_blocks table for storing timeline data
CREATE TABLE IF NOT EXISTS timeline_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time DECIMAL NOT NULL,
  duration DECIMAL NOT NULL,
  content TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scenes table for storing 3D scene data
CREATE TABLE IF NOT EXISTS scenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  scene_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

-- Create policies for projects table
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create policies for timeline_blocks table
CREATE POLICY "Users can view timeline blocks for their projects" ON timeline_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = timeline_blocks.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert timeline blocks for their projects" ON timeline_blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = timeline_blocks.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

-- Create policies for scenes table
CREATE POLICY "Users can view scenes for their projects" ON scenes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = scenes.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

CREATE POLICY "Users can insert scenes for their projects" ON scenes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = scenes.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );
