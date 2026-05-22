import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12 text-slate-950 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div className="overflow-hidden rounded-3xl border border-sky-100 bg-sky-50 p-4">
          <Image
            src="/images/dockulots-removebg-preview.png"
            alt="Doctor Kulot, family medicine specialist"
            width={720}
            height={900}
            className="h-auto w-full object-contain"
          />
        </div>
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">About the Doctor</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Doctor Kulot, Family Medicine Specialist</h1>
          <p className="mt-5 leading-8 text-slate-600">
            Doctor Kulot provides family medicine care with a patient-first approach, combining everyday clinic
            services, online consultations, and health education. The public site keeps booking, FAQs, and contact
            access close at hand while the dashboard supports the clinic behind the scenes.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {["Family Medicine", "Clinic + Online Care", "Health Education"].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 p-5 text-sm font-bold text-slate-800">
                {item}
              </div>
            ))}
          </div>
          <Link href="/#booking" className="mt-8 inline-flex rounded-full bg-sky-600 px-6 py-3 text-sm font-bold text-white">
            Book an appointment
          </Link>
        </section>
      </div>
    </main>
  );
}
