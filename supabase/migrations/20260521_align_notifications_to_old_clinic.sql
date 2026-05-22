-- Align live notifications table with the repository schema and old clinic behavior.

alter table public.notifications
  alter column status set default 'queued';

update public.notifications
set status = lower(status)
where status in ('Pending', 'Sent', 'Failed');

update public.notifications
set status = 'queued'
where status = 'pending';

alter table public.notifications
  drop column if exists title,
  drop column if exists message,
  drop column if exists read_at;
