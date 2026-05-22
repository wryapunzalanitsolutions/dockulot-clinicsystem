"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRole } from "@/src/components/layout/RoleProvider";

type Faq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
};

const emptyFaq = { category: "Appointment FAQ", question: "", answer: "", sort_order: "0", is_published: true };

export default function FaqContentPage() {
  const { accessToken } = useRole();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [form, setForm] = useState(emptyFaq);
  const [feedback, setFeedback] = useState("");

  const headers = useMemo(() => ({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }), [accessToken]);

  async function load() {
    if (!accessToken) return;
    const res = await fetch("/api/v2/faqs", { headers, cache: "no-store" });
    if (res.ok) setFaqs((await res.json()).faqs ?? []);
  }

  useEffect(() => {
    void load();
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addFaq(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accessToken) return;
    const res = await fetch("/api/v2/faqs", {
      method: "POST",
      headers,
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setFeedback((await res.json()).message ?? "Unable to save FAQ");
      return;
    }
    setForm(emptyFaq);
    setFeedback("FAQ saved.");
    await load();
  }

  async function toggle(faq: Faq) {
    if (!accessToken) return;
    await fetch(`/api/v2/faqs/${faq.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ is_published: !faq.is_published }),
    });
    await load();
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[2rem] border border-sky-100 bg-linear-to-br from-sky-50 to-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">FAQ Management</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Public FAQ content</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Add and publish FAQs for appointments, services, online consultations, payments, prescriptions, and patient portal help.
        </p>
        <Link href="/faq" className="mt-5 inline-flex rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white">
          View public FAQ
        </Link>
      </section>

      <form onSubmit={addFaq} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Add FAQ</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Category" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} required />
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Question" value={form.question} onChange={(e) => setForm((s) => ({ ...s, question: e.target.value }))} required />
        </div>
        <textarea className="mt-3 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Answer" value={form.answer} onChange={(e) => setForm((s) => ({ ...s, answer: e.target.value }))} required />
        <button className="mt-4 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white">Save FAQ</button>
      </form>

      {feedback ? <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">{feedback}</p> : null}

      <div className="grid gap-4">
        {faqs.map((faq) => (
          <article key={faq.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">{faq.category}</span>
                <h2 className="mt-2 text-base font-bold text-slate-950">{faq.question}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </div>
              <button onClick={() => toggle(faq)} className="rounded-full border border-sky-200 px-4 py-2 text-xs font-bold text-sky-700">
                {faq.is_published ? "Published" : "Hidden"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
