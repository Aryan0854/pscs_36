-- Remove sample/test data from analytics tables
-- Run this script in your Supabase SQL Editor to remove all sample data

-- Delete sample activity log entries
DELETE FROM activity_log 
WHERE title IN (
  'Healthcare Policy Announcement',
  'Economic Survey Highlights', 
  'Digital India Initiative',
  'Policy Announcement Scene 3'
) OR description LIKE '%Export completed for%' 
   OR description LIKE '%New project created with%'
   OR description LIKE '%Translation completed for%'
   OR description LIKE '%Scene properties updated%';

-- Delete sample system metrics (keep only recent real metrics)
-- Delete metrics older than 1 day that might be sample data
DELETE FROM system_metrics 
WHERE recorded_at < NOW() - interval '1 day';

-- Delete sample language usage data
-- Remove entries that were created with the sample projects
DELETE FROM language_usage 
WHERE project_id IN (
  SELECT id FROM projects 
  WHERE title IN (
    'Healthcare Policy Announcement',
    'Economic Survey Highlights',
    'Digital India Initiative',
    'Education Reform Update',
    'Infrastructure Development'
  )
);

-- Delete sample project exports
-- Remove exports linked to sample projects
DELETE FROM project_exports 
WHERE project_id IN (
  SELECT id FROM projects 
  WHERE title IN (
    'Healthcare Policy Announcement',
    'Economic Survey Highlights',
    'Digital India Initiative',
    'Education Reform Update',
    'Infrastructure Development'
  )
);

-- Delete sample projects
DELETE FROM projects 
WHERE title IN (
  'Healthcare Policy Announcement',
  'Economic Survey Highlights',
  'Digital India Initiative',
  'Education Reform Update',
  'Infrastructure Development'
);

-- Note: After running this script, your dashboard will only show real data
-- If you have no real data yet, the charts will show zeros or empty states
