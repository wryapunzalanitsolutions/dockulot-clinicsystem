"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  FaDownload,
  FaEye,
  FaPlus,
  FaPrint,
  FaPrescriptionBottleMedical,
  FaTrash,
} from "react-icons/fa6";
import { useRole } from "@/src/components/layout/RoleProvider";

type Patient = { id: string; profiles?: { full_name?: string; email?: string } | null };
type Doctor = { id: string; name: string };
type DiagnosisRecord = {
  id: string;
  diagnosis_text: string;
  treatment_plan: string | null;
  follow_up_date: string | null;
  visible_to_patient: boolean;
};
type Prescription = {
  id: string;
  prescription_no: string;
  patient_id: string;
  doctor_id: string;
  general_instructions: string | null;
  follow_up_date: string | null;
  released_to_patient: boolean;
  created_at: string;
  prescription_items?: Array<{ medicine_name: string; dosage: string | null; frequency: string | null; duration: string | null; instructions: string | null }>;
  diagnoses?: DiagnosisRecord | null;
  doctors?: { profiles?: { full_name?: string | null } | null } | null;
  patients?: { profiles?: { full_name?: string; email?: string } | null } | null;
};

type PrescriptionItemDraft = {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

const EMPTY_ITEM: PrescriptionItemDraft = {
  medicine_name: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
};

export default function PrescriptionsPage() {
  const { accessToken, role } = useRole();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState({
    patient_id: "",
    doctor_id: "",
    diagnosis_text: "",
    treatment_plan: "",
    general_instructions: "",
    follow_up_date: "",
    released_to_patient: true,
  });
  const [items, setItems] = useState<PrescriptionItemDraft[]>([{ ...EMPTY_ITEM }]);
  const [feedback, setFeedback] = useState("");

  const headers = useMemo(() => ({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }), [accessToken]);

  async function load() {
    if (!accessToken) return;
    const prescriptionRes = await fetch("/api/v2/prescriptions", { headers, cache: "no-store" });
    if (prescriptionRes.ok) setPrescriptions((await prescriptionRes.json()).prescriptions ?? []);
    if (role !== "PATIENT") {
      const [patientsRes, doctorsRes] = await Promise.all([
        fetch("/api/v2/patients", { headers, cache: "no-store" }),
        fetch("/api/v2/doctors", { headers, cache: "no-store" }),
      ]);
      if (patientsRes.ok) setPatients((await patientsRes.json()).patients ?? []);
      if (doctorsRes.ok) setDoctors((await doctorsRes.json()).doctors ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, [accessToken, role]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateItem(index: number, field: keyof PrescriptionItemDraft, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addItemRow() {
    setItems((current) => [...current, { ...EMPTY_ITEM }]);
  }

  function removeItemRow(index: number) {
    setItems((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)));
  }

  async function createPrescription(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accessToken) return;
    const cleanedItems = items
      .map((item) => ({
        medicine_name: item.medicine_name.trim(),
        dosage: item.dosage.trim(),
        frequency: item.frequency.trim(),
        duration: item.duration.trim(),
        instructions: item.instructions.trim(),
      }))
      .filter((item) => item.medicine_name);

    if (cleanedItems.length === 0) {
      setFeedback("Add at least one medicine item before saving the prescription.");
      return;
    }

    const res = await fetch("/api/v2/prescriptions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        patient_id: form.patient_id,
        doctor_id: form.doctor_id,
        diagnosis_text: form.diagnosis_text,
        treatment_plan: form.treatment_plan,
        general_instructions: form.general_instructions,
        follow_up_date: form.follow_up_date || null,
        released_to_patient: form.released_to_patient,
        items: cleanedItems,
      }),
    });
    if (!res.ok) {
      setFeedback((await res.json()).message ?? "Unable to create prescription");
      return;
    }
    setFeedback("Prescription created.");
    setForm((s) => ({
      ...s,
      diagnosis_text: "",
      treatment_plan: "",
      general_instructions: "",
    }));
    setItems([{ ...EMPTY_ITEM }]);
    await load();
  }

  async function toggleRelease(item: Prescription) {
    if (!accessToken) return;
    await fetch(`/api/v2/prescriptions/${item.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ released_to_patient: !item.released_to_patient }),
    });
    await load();
  }

  async function downloadPdf(item: Prescription) {
    if (!accessToken) return;
    const res = await fetch(`/api/v2/prescriptions/${item.id}/pdf`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      setFeedback("Unable to download prescription PDF.");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${item.prescription_no}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }

  async function printPrescription(item: Prescription) {
    if (!accessToken) return;
    const res = await fetch(`/api/v2/prescriptions/${item.id}/pdf`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      setFeedback("Unable to open printable prescription.");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!printWindow) {
      setFeedback("Pop-up blocked. Please allow pop-ups to print the prescription.");
      window.URL.revokeObjectURL(url);
      return;
    }
    const revoke = () => window.URL.revokeObjectURL(url);
    printWindow.addEventListener("load", () => {
      printWindow.print();
      setTimeout(revoke, 5_000);
    });
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[2rem] border border-sky-100 bg-linear-to-br from-sky-50 to-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">Prescription & Diagnosis</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Prescription records</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Create prescriptions, release them to patients, and print/download portal-ready records.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <CapabilityCard icon={<FaPrescriptionBottleMedical />} title="Doctor creates" text="Medicine, dosage, instructions, plan, and follow-up." />
        <CapabilityCard icon={<FaEye />} title="Controlled visibility" text="Only released prescriptions appear to patients." />
        <CapabilityCard icon={<FaDownload />} title="PDF + Print" text="Download a PDF copy or print for pharmacy-ready use." />
      </div>

      {role !== "PATIENT" ? (
        <form onSubmit={createPrescription} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Create prescription</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <select required className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" value={form.patient_id} onChange={(e) => setForm((s) => ({ ...s, patient_id: e.target.value }))}>
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.profiles?.full_name ?? p.id}</option>)}
            </select>
            <select required className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" value={form.doctor_id} onChange={(e) => setForm((s) => ({ ...s, doctor_id: e.target.value }))}>
              <option value="">Select doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Diagnosis" value={form.diagnosis_text} onChange={(e) => setForm((s) => ({ ...s, diagnosis_text: e.target.value }))} />
            <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Treatment plan" value={form.treatment_plan} onChange={(e) => setForm((s) => ({ ...s, treatment_plan: e.target.value }))} />
            <input type="date" className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" value={form.follow_up_date} onChange={(e) => setForm((s) => ({ ...s, follow_up_date: e.target.value }))} />
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">
              <input type="checkbox" checked={form.released_to_patient} onChange={(e) => setForm((s) => ({ ...s, released_to_patient: e.target.checked }))} />
              Release to patient portal
            </label>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-950">Medicine Items</p>
                <p className="text-xs text-slate-500">Add one or more medicines with dosage and usage instructions.</p>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-50"
              >
                <FaPlus className="h-3 w-3" />
                Add medicine
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {items.map((item, index) => (
                <div key={`item-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Medicine #{index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      disabled={items.length === 1}
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-[11px] font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FaTrash className="h-3 w-3" />
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input
                      required={index === 0}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      placeholder="Medicine name"
                      value={item.medicine_name}
                      onChange={(e) => updateItem(index, "medicine_name", e.target.value)}
                    />
                    <input
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      placeholder="Dosage"
                      value={item.dosage}
                      onChange={(e) => updateItem(index, "dosage", e.target.value)}
                    />
                    <input
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      placeholder="Frequency"
                      value={item.frequency}
                      onChange={(e) => updateItem(index, "frequency", e.target.value)}
                    />
                    <input
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      placeholder="Duration"
                      value={item.duration}
                      onChange={(e) => updateItem(index, "duration", e.target.value)}
                    />
                  </div>
                  <textarea
                    className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    placeholder="Dosage instructions, reminders, or pharmacy notes"
                    value={item.instructions}
                    onChange={(e) => updateItem(index, "instructions", e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <textarea className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="General instructions" value={form.general_instructions} onChange={(e) => setForm((s) => ({ ...s, general_instructions: e.target.value }))} />
          <button className="mt-4 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white">Create prescription</button>
        </form>
      ) : null}

      {feedback ? <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">{feedback}</p> : null}

      <div className="grid gap-4">
        {prescriptions.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none hover:bg-sky-50 transition">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">{item.prescription_no}</span>
                <h2 className="mt-2 text-lg font-bold text-slate-950">{item.patients?.profiles?.full_name ?? "Patient"}</h2>
                <p className="text-sm text-slate-500">
                  Created {new Date(item.created_at).toLocaleDateString()}
                  {item.doctors?.profiles?.full_name ? ` • ${item.doctors.profiles.full_name}` : ""}
                </p>
              </div>
              <div className="flex gap-2 print:hidden">
                {role !== "PATIENT" ? <button onClick={() => toggleRelease(item)} className="rounded-full border border-sky-200 px-4 py-2 text-xs font-bold text-sky-700">{item.released_to_patient ? "Released" : "Hidden"}</button> : null}
                <button onClick={() => downloadPdf(item)} className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-bold text-sky-700"><FaDownload /> Download PDF</button>
                <button onClick={() => printPrescription(item)} className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-xs font-bold text-white"><FaPrint /> Print</button>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {item.diagnoses?.diagnosis_text ? (
                <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Diagnosis</p>
                  <p className="mt-2 text-sm text-slate-700">{item.diagnoses.diagnosis_text}</p>
                </div>
              ) : null}
              {item.diagnoses?.treatment_plan ? (
                <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Treatment Plan</p>
                  <p className="mt-2 text-sm text-slate-700">{item.diagnoses.treatment_plan}</p>
                </div>
              ) : null}
              {(item.prescription_items ?? []).map((rx, index) => (
                <div key={`${item.id}-${index}`} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-bold text-slate-950">{rx.medicine_name}</p>
                  <p className="mt-1 text-sm text-slate-600">{[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(" - ")}</p>
                  {rx.instructions ? <p className="mt-2 text-sm text-slate-600">{rx.instructions}</p> : null}
                </div>
              ))}
            </div>
            {item.general_instructions ? <p className="mt-4 text-sm leading-6 text-slate-700">{item.general_instructions}</p> : null}
            {item.follow_up_date ? <p className="mt-3 text-sm font-semibold text-sky-700">Follow-up: {item.follow_up_date}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function CapabilityCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="text-2xl text-sky-600">{icon}</div>
      <h2 className="mt-4 text-base font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}
