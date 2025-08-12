-- Create analytics tables for PIB Multilingual Video Platform

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  language_count INTEGER DEFAULT 0,
  scene_count INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0
);

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

-- Insert sample data for testing
INSERT INTO projects (title, description, status, language_count, scene_count, duration_minutes) VALUES
('Healthcare Policy Announcement', 'New healthcare initiatives for rural areas', 'completed', 6, 4, 8),
('Economic Survey Highlights', 'Key findings from annual economic survey', 'active', 8, 6, 12),
('Digital India Initiative', 'Progress update on digital transformation', 'completed', 5, 3, 6),
('Education Reform Update', 'Latest changes in education policy', 'active', 7, 5, 10),
('Infrastructure Development', 'Major infrastructure projects update', 'completed', 4, 3, 7);

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
