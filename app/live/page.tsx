import { liveEvents } from "@/src/lib/healthcare-content";

export default function LivePage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Live Schedule</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Upcoming live health talks</h1>
        <div className="mt-10 grid gap-5">
          {liveEvents.map((event) => (
            <article key={event.title} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{event.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{event.date} at {event.time} - {event.platform}</p>
                </div>
                <button className="w-full rounded-full bg-sky-600 px-5 py-3 text-sm font-bold text-white md:w-auto">
                  {event.linkLabel}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
