-- 20260506_add_default_meeting_link.sql
-- Stores the clinic's permanent Google Meet (or any web meeting) link.
-- Used by every Online consultation booking unless an appointment has its
-- own explicit meeting_link override.

alter table public.system_settings
  add column if not exists default_meeting_link text not null default '';

-- Drop any sample placeholder links from legacy bookings so the UI surfaces
-- a "no link yet" hint instead of routing patients to a fake domain.
update public.appointments
  set meeting_link = null
  where meeting_link is not null
    and meeting_link like '%meet.chiara.clinic%';
