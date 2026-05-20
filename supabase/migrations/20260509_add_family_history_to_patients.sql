alter table public.patients
  add column if not exists family_history text;

comment on column public.patients.family_history is
  'Long-form family medical history entered on the patient record and reused across visits.';
