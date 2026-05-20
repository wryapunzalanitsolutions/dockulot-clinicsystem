-- Add is_read column to notifications table for per-notification read tracking
alter table public.notifications add column if not exists is_read boolean not null default false;

-- Create index for efficient unread notification queries
create index if not exists notifications_unread_idx 
  on public.notifications(user_id, is_read, created_at desc) 
  where is_read = false;
