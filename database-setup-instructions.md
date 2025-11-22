# Database Setup Instructions

To set up the database for the PIB Multilingual Video Platform, you need to run the SQL scripts in your Supabase dashboard. Follow these steps:

## 1. Access Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor

## 2. Run the SQL Scripts in Order

Run each of the following scripts in the SQL Editor:

### a. Create Projects Table
File: `scripts/create-projects-table.sql`

```sql
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
```

### b. Create Project Tables (Timeline and Scenes)
File: `scripts/create-project-tables.sql`

```sql
-- Create tables for timeline and scene data storage
CREATE TABLE IF NOT EXISTS project_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  timeline_data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_scenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  scenes_data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_timeline_project_id ON project_timeline(project_id);
CREATE INDEX IF NOT EXISTS idx_project_scenes_project_id ON project_scenes(project_id);
```

### c. Create Audio Files Table
File: `scripts/create-audio-files-table.sql`

```sql
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
```

### d. Create User Profiles Table
File: `scripts/create-user-profiles.sql`

```sql
-- Create user profiles table to store additional user information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  organization TEXT,
  role TEXT DEFAULT 'user',
  department TEXT,
  phone TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own profile
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### e. Create Analytics Tables
File: `scripts/create-analytics-tables.sql`

```sql
-- Create analytics tables for PIB Multilingual Video Platform

-- Project exports table
CREATE TABLE IF NOT EXISTS project_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL,
  format VARCHAR(10) DEFAULT 'mp4',
  quality VARCHAR(20) DEFAULT 'high',
  status VARCHAR(50) DEFAULT 'pending',
  processing_time_minutes INTEGER,
  file_size_mb DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Language usage tracking
CREATE TABLE IF NOT EXISTS language_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  language VARCHAR(10) NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System metrics tracking
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data for testing (updated to match the correct schema)
INSERT INTO projects (title, description, status, file_name, file_type, file_size) VALUES
('Healthcare Policy Announcement', 'New healthcare initiatives for rural areas', 'completed', 'healthcare_policy.pdf', 'application/pdf', 1024000),
('Economic Survey Highlights', 'Key findings from annual economic survey', 'active', 'economic_survey.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 2048000),
('Digital India Initiative', 'Progress update on digital transformation', 'completed', 'digital_india.txt', 'text/plain', 512000),
('Education Reform Update', 'Latest changes in education policy', 'active', 'education_reform.pdf', 'application/pdf', 1536000),
('Infrastructure Development', 'Major infrastructure projects update', 'completed', 'infrastructure.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 768000);

-- Insert sample exports
INSERT INTO project_exports (project_id, language, processing_time_minutes, file_size_mb, status, completed_at) 
SELECT 
  p.id,
  CASE (random() * 4)::int 
    WHEN 0 THEN 'hi'
    WHEN 1 THEN 'en'
    WHEN 2 THEN 'bn'
    WHEN 3 THEN 'ta'
    ELSE 'te'
  END,
  (random() * 60 + 10)::int,
  (random() * 500 + 50)::decimal(10,2),
  'completed',
  NOW() - (random() * interval '30 days')
FROM projects p, generate_series(1, 3);

-- Insert language usage data
INSERT INTO language_usage (language, project_id, usage_count) 
SELECT 
  CASE (random() * 4)::int 
    WHEN 0 THEN 'hi'
    WHEN 1 THEN 'en'
    WHEN 2 THEN 'bn'
    WHEN 3 THEN 'ta'
    ELSE 'te'
  END,
  p.id,
  (random() * 10 + 1)::int
FROM projects p;

-- Insert system metrics
INSERT INTO system_metrics (metric_type, value, recorded_at) 
SELECT 
  metric_type,
  (random() * 100)::decimal(10,2),
  NOW() - (random() * interval '7 days')
FROM (
  SELECT unnest(ARRAY['cpu_usage', 'memory_usage', 'storage_usage']) as metric_type
) metrics,
generate_series(1, 20);

-- Insert activity log
INSERT INTO activity_log (activity_type, title, description, created_at) VALUES
('export_completed', 'Healthcare Policy Announcement', 'Export completed for 6 languages', NOW() - interval '2 minutes'),
('project_created', 'Economic Survey Highlights', 'New project created with 8 scenes', NOW() - interval '15 minutes'),
('translation_finished', 'Digital India Initiative', 'Translation completed for Tamil', NOW() - interval '1 hour'),
('scene_updated', 'Policy Announcement Scene 3', 'Scene properties updated', NOW() - interval '2 hours');
```

## 3. Verify Database Setup

After running all the scripts, verify that the tables have been created:

1. Go to the Table Editor in your Supabase dashboard
2. Check that all the following tables exist:
   - projects
   - timeline_blocks
   - scenes
   - project_timeline
   - project_scenes
   - audio_files
   - user_profiles
   - project_exports
   - language_usage
   - system_metrics
   - activity_log

## 4. Restart the Development Server

After setting up the database, restart your development server:

```bash
pnpm run dev
```

This should resolve the network error you were experiencing during file upload.