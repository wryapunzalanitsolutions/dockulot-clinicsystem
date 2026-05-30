import Link from "next/link";
import { FaArrowRight, FaCalendarCheck, FaVideo } from "react-icons/fa";
import PublicHeader from "@/src/components/layout/PublicHeader";
import { getPublishedMediaPosts } from "@/src/lib/services/content-posts";

export default async function VideosPage() {
  const videos = await getPublishedMediaPosts(24);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <PublicHeader />

      <section className="mx-auto max-w-7xl px-4 pt-20 pb-12 sm:px-6 sm:pt-24">
        <div className="mb-8 border-b border-slate-200 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-slate-500">
              <Link href="/#videos" className="transition hover:text-sky-700">
                Landing page
              </Link>
              <span className="px-2 text-slate-400">/</span>
              <span className="text-slate-700">Videos and vlogs</span>
            </div>
            <Link
              href="/#videos"
              className="inline-flex items-center gap-2 self-start rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-bold text-sky-800 transition hover:bg-sky-50"
            >
              Back to vlogs
              <FaArrowRight />
            </Link>
          </div>
        </div>

        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Video / Vlog Page</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Doctor content, public videos, and live replays</h1>
          <p className="mt-4 leading-8 text-slate-600">
            This page pulls from the content creator platform so Doctor Kulot can manage YouTube, TikTok, Facebook,
            replay, and announcement content in one place.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {videos.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="aspect-video bg-slate-100">
                {post.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.thumbnail_url} alt={post.title} className="h-full w-full object-cover" />
                ) : post.embed_url ? (
                  <iframe
                    src={post.embed_url}
                    title={post.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : post.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.thumbnail_url} alt={post.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
                    Media preview not attached yet
                  </div>
                )}
              </div>

                <div className="space-y-4 p-6">
                <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  <span>{post.content_type}</span>
                  <span>{post.category}</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">{post.title}</h2>
                <p className="text-sm leading-7 text-slate-600">
                  {post.excerpt || "This creator video or announcement will show more detail once the content team adds a summary."}
                </p>
                <div className="rounded-[1.35rem] border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-slate-600">
                  {post.content_type === "LiveReplay"
                    ? "Missed the live session? Open the replay, then check the live schedule for the next health talk."
                    : post.content_type === "Announcement"
                      ? "Clinic updates and creator announcements are posted here so followers can act right away."
                      : "Watch the vlog, then continue with booking, live events, or more health education from the clinic."}
                </div>
                <div className="flex flex-wrap gap-3">
                  {post.embed_url ? (
                    <Link
                      href={post.embed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-500"
                    >
                      Open source
                      <FaArrowRight />
                    </Link>
                  ) : null}
                  <Link
                    href="/#booking"
                    className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-5 py-2.5 text-sm font-bold text-sky-800 transition hover:bg-sky-50"
                  >
                    <FaCalendarCheck />
                    Book appointment
                  </Link>
                  <Link
                    href="/live"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    <FaVideo />
                    Live schedule
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {!videos.length ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 px-6 py-10 text-center text-sm leading-7 text-slate-500 lg:col-span-2">
              No public video posts have been published yet. Once the creator team publishes videos, replays, or announcements, they will appear here.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
