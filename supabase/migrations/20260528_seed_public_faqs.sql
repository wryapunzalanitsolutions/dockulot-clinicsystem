insert into public.faqs (category, question, answer, sort_order, is_published)
select *
from (
  values
    (
      'Appointment FAQ',
      'How to book an appointment?',
      'Open the booking page, choose clinic visit or online consultation, select a service, date, and time, then submit your patient details.',
      10,
      true
    ),
    (
      'Clinic Services FAQ',
      'Do you accept walk-in patients?',
      'Walk-ins can be encoded by clinic staff, but scheduled patients are prioritized depending on the doctor''s availability.',
      20,
      true
    ),
    (
      'Prescription FAQ',
      'How can I access my prescription?',
      'Log in to the patient portal and open your consultation history. Prescriptions shared by the doctor can be viewed, printed, or downloaded.',
      30,
      true
    ),
    (
      'Patient Portal FAQ',
      'Can I print my prescription online?',
      'Yes. If the doctor has released it to your portal, you can download the PDF or print it for pharmacy use.',
      40,
      true
    ),
    (
      'Online Consultation FAQ',
      'How do I book an online consultation?',
      'Choose Online Consultation during booking, describe your concern, upload supporting files if needed, and wait for confirmation and meeting details.',
      50,
      true
    ),
    (
      'Vlog/Content FAQ',
      'Where can I watch doctor’s videos?',
      'Open the Videos page for embedded YouTube, TikTok, Facebook videos, live replays, and health education content.',
      60,
      true
    ),
    (
      'Contact & Inquiry FAQ',
      'How can I send an inquiry?',
      'Use the Contact page for appointment, service, consultation, collaboration, or general questions.',
      70,
      true
    ),
    (
      'Payment FAQ',
      'What services are available?',
      'Visitors can book clinic visits, online consultations, follow-up checkups, wellness consultations, prescription review support, and other listed public services.',
      80,
      true
    )
) as seed(category, question, answer, sort_order, is_published)
where not exists (
  select 1
  from public.faqs existing
  where existing.category = seed.category
    and existing.question = seed.question
);
