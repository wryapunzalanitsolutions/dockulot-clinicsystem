"use client";

import dynamic from "next/dynamic";

const WalkInIntakePage = dynamic(
  () => import("@/src/components/patients/WalkInIntakePage"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        Loading walk-in intake...
      </div>
    ),
  },
);

export default function AddWalkInPatientPage() {
  return <WalkInIntakePage />;
}
