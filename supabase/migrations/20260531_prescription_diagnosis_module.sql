alter table public.diagnoses
  alter column appointment_id drop not null;

alter table public.diagnoses
  drop constraint if exists diagnoses_appointment_id_fkey;

alter table public.diagnoses
  add constraint diagnoses_appointment_id_fkey
  foreign key (appointment_id) references public.appointments(id) on delete set null;
