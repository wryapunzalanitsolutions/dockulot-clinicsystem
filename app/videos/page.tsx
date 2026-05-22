import { featuredContent } from "@/src/lib/healthcare-content";

export default function VideosPage() {
  const videos = featuredContent.filter((item) => item.type === "Video" || item.type === "Live");
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">Video / Vlog Page</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Doctor video content</h1>
        <p className="mt-4 max-w-3xl leading-8 text-slate-300">
          Supports YouTube, TikTok, Facebook embeds, FAQ videos, live replays, health tips, and patient education.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {videos.map((video) => (
            <article key={video.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="aspect-video rounded-xl bg-slate-800" />
              <span className="mt-5 block text-xs font-bold uppercase tracking-[0.2em] text-sky-300">{video.category}</span>
              <h2 className="mt-3 text-xl font-bold">{video.title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{video.description}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
