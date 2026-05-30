import type { IconType } from "react-icons";
import {
  FaCalendarCheck,
  FaCertificate,
  FaFlaskVial,
  FaHeartPulse,
  FaLaptopMedical,
  FaPrescriptionBottleMedical,
  FaStethoscope,
  FaUserDoctor,
} from "react-icons/fa6";

export type PublicNavItem = {
  label: string;
  href: string;
};

export type ServiceItem = {
  title: string;
  description: string;
  icon: IconType;
};

export type ContentItem = {
  title: string;
  category: string;
  description: string;
  type: "Blog" | "Video" | "Live" | "Announcement";
};

export type FaqItem = {
  category: string;
  question: string;
  answer: string;
};

export const faqCategories = [
  "Appointment FAQ",
  "Clinic Services FAQ",
  "Online Consultation FAQ",
  "Payment FAQ",
  "Prescription FAQ",
  "Patient Portal FAQ",
  "Vlog/Content FAQ",
  "Contact & Inquiry FAQ",
];

export const publicNav: PublicNavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Online", href: "/online-services" },
  { label: "Book", href: "/booking" },
  { label: "Blog", href: "/#blog" },
  { label: "Videos", href: "/#videos" },
  { label: "Live", href: "/#live" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export const clinicServices: ServiceItem[] = [
  {
    title: "General Consultation",
    description: "Clinic-based assessment for common health concerns, follow-ups, and primary care.",
    icon: FaStethoscope,
  },
  {
    title: "Online Consultation",
    description: "Secure virtual visit for eligible concerns with post-consultation guidance.",
    icon: FaLaptopMedical,
  },
  {
    title: "Follow-up Checkup",
    description: "Review symptoms, treatment progress, lab results, and next steps.",
    icon: FaCalendarCheck,
  },
  {
    title: "Medical Certificate Request",
    description: "Request documentation after appropriate clinical assessment and approval.",
    icon: FaCertificate,
  },
  {
    title: "Laboratory Referral",
    description: "Get lab referral guidance based on the doctor's assessment.",
    icon: FaFlaskVial,
  },
  {
    title: "Prescription Renewal",
    description: "Medication renewal review for eligible maintenance or follow-up cases.",
    icon: FaPrescriptionBottleMedical,
  },
  {
    title: "Health Coaching",
    description: "Practical coaching for prevention, habits, adherence, and health goals.",
    icon: FaHeartPulse,
  },
  {
    title: "Wellness Consultation",
    description: "Lifestyle, wellness, and patient education support tailored to the patient.",
    icon: FaUserDoctor,
  },
];

export const portalFeatures = [
  "View appointment history",
  "View allowed diagnosis and consultation notes",
  "View, download, and print prescriptions",
  "View billing history and receipts",
  "Access uploaded medical files",
  "Send follow-up inquiries",
  "Book another appointment",
];

export const dashboardModules = [
  { title: "Appointments", description: "Clinic and online booking, approvals, queue, reminders, and calendar." },
  { title: "Patient Records", description: "Patient profile, history, files, vitals, and controlled patient visibility." },
  { title: "Diagnosis & Prescriptions", description: "Diagnosis, dosage instructions, treatment plan, follow-up date, PDF/print output." },
  { title: "POS & Billing", description: "Invoices, services, medicine/product sales, payments, receipts, and sales history." },
  { title: "Inventory", description: "Products, medicines, stock movement, low stock alerts, expiry, suppliers, and reports." },
  { title: "Creator Content", description: "Blogs, videos, health tips, announcements, live events, and featured content." },
  { title: "Inquiry System", description: "Visitor questions, replies, statuses, and inquiry-to-appointment conversion." },
  { title: "Reports & Security", description: "Clinic, content, sales, inventory reports, roles, access control, and activity logs." },
];

export const contentCategories = [
  "Health Tips",
  "Clinic Updates",
  "Medical Awareness",
  "Patient Education",
  "Online Consultation Topics",
  "Lifestyle & Wellness",
  "FAQ Videos",
  "Live Replays",
];

export const featuredContent: ContentItem[] = [
  {
    title: "When to choose online consultation",
    category: "Online Consultation Topics",
    description: "A practical guide for deciding whether your concern is safe for virtual care.",
    type: "Blog",
  },
  {
    title: "Prescription safety reminders",
    category: "Patient Education",
    description: "Simple reminders before renewing or changing medication routines.",
    type: "Video",
  },
  {
    title: "Weekly Ask the Doctor Live",
    category: "FAQ Videos",
    description: "A scheduled live Q&A that helps followers become informed patients.",
    type: "Live",
  },
  {
    title: "Clinic schedule update",
    category: "Clinic Updates",
    description: "Pinned announcement for holidays, blocked dates, or updated service hours.",
    type: "Announcement",
  },
];

export const liveEvents = [
  {
    title: "Ask the Doctor: Common Adult Health Concerns",
    date: "June 7, 2026",
    time: "7:00 PM",
    platform: "Facebook Live / YouTube Live",
    linkLabel: "Register interest",
  },
  {
    title: "Wellness Talk: Better Habits for Busy Patients",
    date: "June 21, 2026",
    time: "6:30 PM",
    platform: "Zoom Webinar",
    linkLabel: "Join waitlist",
  },
  {
    title: "Live Replay: Online Consultation FAQs",
    date: "Available after stream",
    time: "On demand",
    platform: "YouTube Replay",
    linkLabel: "Watch replay",
  },
];

export const faqs: FaqItem[] = [
  {
    category: "Appointment FAQ",
    question: "How to book an appointment?",
    answer: "Open the booking page, choose clinic visit or online consultation, select a service, date, and time, then submit your patient details.",
  },
  {
    category: "Clinic Services FAQ",
    question: "Do you accept walk-in patients?",
    answer: "Walk-ins can be encoded by clinic staff, but scheduled patients are prioritized depending on the doctor's availability.",
  },
  {
    category: "Prescription FAQ",
    question: "How can I access my prescription?",
    answer: "Log in to the patient portal and open your consultation history. Prescriptions shared by the doctor can be viewed, printed, or downloaded.",
  },
  {
    category: "Patient Portal FAQ",
    question: "Can I print my prescription online?",
    answer: "Yes. If the doctor has released it to your portal, you can download the PDF or print it for pharmacy use.",
  },
  {
    category: "Online Consultation FAQ",
    question: "How do I book an online consultation?",
    answer: "Choose Online Consultation during booking, describe your concern, upload supporting files if needed, and wait for confirmation and meeting details.",
  },
  {
    category: "Vlog/Content FAQ",
    question: "Where can I watch doctor’s videos?",
    answer: "Open the Videos page for embedded YouTube, TikTok, Facebook videos, live replays, and health education content.",
  },
  {
    category: "Contact & Inquiry FAQ",
    question: "How can I send an inquiry?",
    answer: "Use the Contact page for appointment, service, consultation, collaboration, or general questions.",
  },
  {
    category: "Payment FAQ",
    question: "What services are available?",
    answer: "Visitors can book clinic visits, online consultations, follow-up checkups, wellness consultations, prescription review support, and other listed public services.",
  },
];

export const onlineConsultationSteps = [
  "Choose online consultation during booking",
  "Upload symptoms, concern, photos, or files if needed",
  "Select a preferred schedule",
  "Wait for admin approval and meeting link",
  "Join via Google Meet or Zoom",
  "Receive diagnosis and prescription in the patient portal when released",
];

export const retainedSystemModules = [
  "Public website and doctor creator content",
  "Appointment booking and doctor schedule calendar",
  "Patient portal",
  "Diagnosis, prescriptions, and consultation notes",
  "Doctor dashboard",
  "Admin/staff dashboard",
  "POS and billing",
  "Inventory",
  "FAQ and inquiry management",
  "Online consultation",
  "Clinic and content reports",
  "Role-based security and activity logs",
];

export const removedReferenceModules = [
  "Reference clinic branding and old landing copy",
  "Old schema assumptions from the previous Supabase project",
  "Single-purpose consultation pricing content as the main public message",
];
