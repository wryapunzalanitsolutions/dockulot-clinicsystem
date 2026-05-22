import { faqs } from "@/src/lib/healthcare-content";

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-sky-50/60 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">FAQ System</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Frequently asked questions</h1>
        <div className="mt-10 grid gap-4">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer list-none text-base font-bold text-slate-950">
                {faq.question}
                <span className="ml-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{faq.category}</span>
              </summary>
              <p className="mt-4 border-t border-slate-100 pt-4 leading-7 text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
