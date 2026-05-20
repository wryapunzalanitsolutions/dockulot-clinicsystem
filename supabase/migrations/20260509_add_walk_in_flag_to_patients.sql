alter table public.patients
  add column if not exists is_walk_in boolean not null default false;

comment on column public.patients.is_walk_in is
  'True when the patient was added through front-desk walk-in intake.';
