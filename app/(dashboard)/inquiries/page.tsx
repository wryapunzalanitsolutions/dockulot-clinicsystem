"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { FaEnvelopeOpenText, FaReply, FaUserPlus } from "react-icons/fa6";
import { useRole } from "@/src/components/layout/RoleProvider";

type Inquiry = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  inquiry_type: string;
  message: string;
  status: "Pending" | "Replied" | "Closed";
  reply: string | null;
  created_at: string;
};

export default function InquiriesPage() {
  const { accessToken } = useRole();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [replyById, setReplyById] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");

  const headers = useMemo(() => ({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }), [accessToken]);

  async function load() {
    if (!accessToken) return;
    const res = await fetch("/api/v2/inquiries", { headers, cache: "no-store" });
    if (res.ok) setInquiries((await res.json()).inquiries ?? []);
  }

  useEffect(() => {
    void load();
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateInquiry(id: string, payload: Record<string, unknown>) {
    if (!accessToken) return;
    const res = await fetch(`/api/v2/inquiries/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setFeedback((await res.json()).message ?? "Unable to update inquiry");
      return;
    }
    setFeedback("Inquiry updated.");
    await load();
  }

  const pending = inquiries.filter((i) => i.status === "Pending").length;
  const replied = inquiries.filter((i) => i.status === "Replied").length;
  const closed = inquiries.filter((i) => i.status === "Closed").length;

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[2rem] border border-sky-100 bg-linear-to-br from-sky-50 to-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">Inquiry System</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Visitor and patient inquiries</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Reply, close, and convert qualified inquiries into appointments from one inbox.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={<FaEnvelopeOpenText />} title="Pending" value={pending} />
        <Metric icon={<FaReply />} title="Replied" value={replied} />
        <Metric icon={<FaUserPlus />} title="Closed" value={closed} />
      </div>

      {feedback ? <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">{feedback}</p> : null}

      <div className="grid gap-4">
        {inquiries.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">{item.status}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.inquiry_type}</span>
                  <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <h2 className="mt-3 text-lg font-bold text-slate-950">{item.name}</h2>
                <p className="text-sm text-slate-500">{item.email ?? "No email"} {item.phone ? `- ${item.phone}` : ""}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.message}</p>
                {item.reply ? <p className="mt-3 rounded-xl bg-sky-50 p-3 text-sm text-sky-800"><strong>Reply:</strong> {item.reply}</p> : null}
              </div>
              <div className="w-full max-w-md">
                <textarea
                  className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  placeholder="Write reply"
                  value={replyById[item.id] ?? ""}
                  onChange={(e) => setReplyById((current) => ({ ...current, [item.id]: e.target.value }))}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => updateInquiry(item.id, { reply: replyById[item.id] ?? "" })} className="rounded-full bg-sky-600 px-4 py-2 text-xs font-bold text-white">Save reply</button>
                  <button onClick={() => updateInquiry(item.id, { status: "Closed" })} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700">Close</button>
                  <button onClick={() => updateInquiry(item.id, { status: "Pending" })} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700">Reopen</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Metric({ icon, title, value }: { icon: ReactNode; title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-2xl text-sky-600">{icon}</div>
      <p className="mt-3 text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}
