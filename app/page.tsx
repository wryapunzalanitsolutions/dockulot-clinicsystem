import Image from "next/image";
import Link from "next/link";
import MobileNav from "@/src/components/layout/MobileNav";
import { FaArrowRight, FaHome, FaInfoCircle, FaQuoteRight, FaStethoscope, FaVideo, FaQuestionCircle, FaPhone, FaSignInAlt, FaUserPlus } from "react-icons/fa";
import BookAppointmentPage from "@/src/components/appointments/BookAppointmentPage";
import InquiryForm from "@/src/components/marketing/InquiryForm";
import {
  clinicServices,
  contentCategories,
  dashboardModules,
  featuredContent,
} from "@/src/lib/healthcare-content";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 overflow-x-hidden">
      <PublicHeader />

      <section id="hero" className="relative isolate min-h-[100svh] overflow-hidden">
        <Image
          src="/images/dockulotbgs.png"
          alt="Clinic background"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/30 to-sky-900/20" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-7xl items-center justify-center px-4 pb-14 pt-20 sm:px-6 sm:pt-24 lg:justify-end lg:pt-16">
          <div className="max-w-2xl text-center lg:max-w-3xl lg:text-right">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-200 sm:tracking-[0.28em] lg:text-right">
              Doctor Kulot Clinic — Family Medicine
            </p>
            <h1 className="mt-4 text-3xl font-black leading-tight text-white drop-shadow-xl sm:mt-5 sm:text-5xl lg:text-7xl">
              Modern Medicine. Personal Care. Your Health, Simplified.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-7 text-slate-200 sm:mt-6 sm:text-base sm:leading-8 lg:ml-auto lg:mr-0 lg:max-w-2xl lg:text-right lg:text-lg">
              Book appointments online or in-clinic, manage prescriptions, and access your full health records whenever you need them. Connect with Doctor Kulot and your care team anytime through a secure, unified patient portal.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-end">
              <Link
                href="/#online"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-sky-950/20 transition hover:bg-sky-500"
              >
                Book Appointment <FaArrowRight />
              </Link>
              <Link
                href="/#clinic"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-200 bg-white/70 px-6 py-3 text-sm font-bold text-sky-800 backdrop-blur transition hover:bg-white/90"
              >
                View Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="bg-white py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="overflow-hidden rounded-[2rem] border border-sky-100 bg-sky-50 p-4 shadow-sm">
            <Image
              src="/images/dockulots-removebg-preview.png"
              alt="Doctor Kulot, family medicine specialist"
              width={900}
              height={1100}
              className="h-auto w-full object-contain"
            />
          </div>
          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">About the Doctor</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Doctor Kulot, Family Medicine Specialist
            </h2>
            <p className="mt-5 max-w-2xl leading-8 text-slate-600">
              Doctor Kulot is a family medicine specialist focused on compassionate, whole-person care for patients
              of all ages. The landing page now introduces her directly so visitors can immediately see who is behind
              the clinic, the care philosophy, and the services available.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                "Family Medicine",
                "Clinic + Online Care",
                "Patient Education",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-sky-100 p-5 text-sm font-bold text-slate-800">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/#booking" className="inline-flex rounded-full bg-sky-600 px-6 py-3 text-sm font-bold text-white">
                Book an appointment
              </Link>
              <Link
                href="/about"
                className="inline-flex rounded-full border border-sky-200 bg-white px-6 py-3 text-sm font-bold text-sky-800"
              >
                Learn more about Doctor Kulot
              </Link>
            </div>
          </section>
        </div>
      </section>

      <section id="clinic" className="bg-sky-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Clinic Services"
            title="Services ready for booking and billing"
            description="Patients can see available services before they book, while staff can later bill service and product sales through POS."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {clinicServices.map((service) => (
              <article key={service.title} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <service.icon className="text-2xl text-sky-600" />
                <h3 className="mt-4 text-lg font-bold text-slate-950">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="online" className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Online / Booking Services"
            title="Book clinic visits or online consultations"
            description="The booking flow supports service type, date/time selection, patient details, appointment status, doctor schedule, and admin approval."
          />
          <div id="booking" className="rounded-3xl border border-sky-100 bg-white p-4 sm:p-6 shadow-xl overflow-visible w-full">
            <BookAppointmentPage />
          </div>
        </div>
      </section>

      <section id="blogs" className="bg-sky-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Blogs"
            title="Health tips, clinic news, and patient education"
            description="Blog content is now surfaced here on the landing page instead of sending visitors to a separate page."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredContent.map((item) => (
              <article key={item.title} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">{item.type}</span>
                <h3 className="mt-3 text-base font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{item.category}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="videos" className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Videos"
            title="Doctor vlogs and live schedule on one page"
            description="The live schedule is part of the Videos section, so visitors do not leave the landing page."
          />
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6">
              <h3 className="text-lg font-bold text-slate-950">Video Topics</h3>
              <div className="mt-5 flex flex-wrap gap-2">
                {contentCategories.map((category) => (
                  <span key={category} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                    {category}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                {dashboardModules.slice(0, 4).map((module) => (
                  <article key={module.title} className="rounded-xl border border-sky-100 p-4">
                    <h3 className="text-base font-bold text-slate-950">{module.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                  </article>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Live schedule entries stay in this section so it remains part of the landing page.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-sky-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Quick answers for common clinic questions"
            description="Frequently asked questions now live on the landing page instead of a separate page."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FaqItem
              question="How do I book a clinic appointment?"
              answer="Use the booking section above to select clinic or online, then choose a schedule and submit your details."
            />
            <FaqItem
              question="Where is the live schedule?"
              answer="It is inside the Videos section on this landing page, so you can view it without leaving home."
            />
            <FaqItem
              question="Can I sign in or create an account?"
              answer="Yes. Use the Sign In and Sign Up buttons in the header to go to the login and register pages."
            />
            <FaqItem
              question="Where do I contact the clinic?"
              answer="Use the Contact button in the header to open the contact page."
            />
          </div>
        </div>
      </section>

      <section id="contact" className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Contact / Inquiry</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Send an inquiry</h2>
              <p className="mt-4 leading-8 text-slate-600">
                Ask about appointments, services, consultations, or general questions. Our team will reply or convert
                inquiries into appointments when appropriate.
              </p>
              <Link href="/#booking" className="mt-8 inline-flex rounded-full bg-sky-600 px-6 py-3 text-sm font-bold text-white">
                Go to booking
              </Link>
            </section>
            <InquiryForm />
          </div>
        </div>
      </section>

      <footer className="bg-sky-950 px-4 py-10 text-center text-sm text-slate-300 sm:px-6">
        Healthcare & Doctor Creator System. Built from the retained clinic modules with a fresh Supabase schema.
      </footer>
    </main>
  );
}

function PublicHeader() {
  return (
    <header className="relative md:fixed md:inset-x-0 md:top-0 md:z-50 border-b border-sky-200/50 bg-sky-50/55 backdrop-blur-md">
      <div className="mx-auto flex h-12 sm:h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="flex h-full items-center gap-3">
          <Image
            src="/images/dockulotslogonobg.png"
            alt="Clinic logo"
            width={220}
            height={88}
            className="h-12 w-auto max-h-full object-contain sm:h-14 sm:w-auto lg:h-[4.5rem]"
          />
        </Link>
        <nav className="hidden items-center gap-4 lg:flex">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-sky-700">
            <FaHome className="text-sky-600" />
            Home
          </Link>
          <Link href="/#about" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-sky-700">
            <FaInfoCircle className="text-sky-600" />
            About
          </Link>

          <div className="group relative h-full">
            <button
              type="button"
              className="h-16 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-sky-700"
            >
              <FaStethoscope className="text-sky-600" />
              Services
            </button>
            <div className="invisible absolute right-0 top-full w-48 pt-2 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="rounded-lg border border-sky-100 bg-white p-2 shadow-lg">
                <Link href="/#clinic" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-800 hover:bg-sky-50">
                  <FaStethoscope className="text-sky-600" />
                  Clinic
                </Link>
                <Link href="/#online" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-800 hover:bg-sky-50">
                  <FaPhone className="text-sky-600" />
                  Online
                </Link>
              </div>
            </div>
          </div>

          <Link href="/#blogs" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-sky-700">
            <FaQuoteRight className="text-sky-600" />
            Blogs
          </Link>
          <Link href="/#videos" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-sky-700">
            <FaVideo className="text-sky-600" />
            Videos
          </Link>
          <Link href="/#faq" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-sky-700">
            <FaQuestionCircle className="text-sky-600" />
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <MobileNav />
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 rounded-full border border-sky-300 bg-white/70 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-white"
          >
            <FaPhone className="text-sky-600" />
            Contact
          </Link>
          <Link href="/login" className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-sky-700">
            <FaSignInAlt className="text-sky-600" />
            Sign In
          </Link>
          <Link
            href="/register"
            className="ml-2 hidden sm:inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-500"
          >
            <FaUserPlus />
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  inverted = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  inverted?: boolean;
}) {
  return (
    <div className="mb-10 max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">{eyebrow}</p>
      <h2 className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${inverted ? "text-white" : "text-slate-950"}`}>
        {title}
      </h2>
      <p className={`mt-4 leading-7 ${inverted ? "text-slate-300" : "text-slate-600"}`}>{description}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <article className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-slate-950">{question}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
    </article>
  );
}