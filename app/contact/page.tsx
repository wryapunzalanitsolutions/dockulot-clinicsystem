import Link from "next/link";
import InquiryForm from "@/src/components/marketing/InquiryForm";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Contact / Inquiry</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Send an inquiry</h1>
          <p className="mt-4 leading-8 text-slate-600">
            Visitors can ask about appointments, services, consultations, collaborations, or general questions. Admin can
            reply, close, or convert inquiries into appointments in the schema.
          </p>
          <Link href="/#booking" className="mt-8 inline-flex rounded-full bg-sky-600 px-6 py-3 text-sm font-bold text-white">
            Go to booking
          </Link>
        </section>
        <InquiryForm />
      </div>
    </main>
  );
}
