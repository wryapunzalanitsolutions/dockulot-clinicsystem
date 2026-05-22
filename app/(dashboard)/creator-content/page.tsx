"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { FaBullhorn, FaCalendarDays, FaVideo } from "react-icons/fa6";
import { useRole } from "@/src/components/layout/RoleProvider";

type Post = {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  category: string;
  excerpt: string | null;
  embed_url: string | null;
  status: string;
  is_featured: boolean;
};

type LiveEvent = {
  id: string;
  title: string;
  starts_at: string;
  platform: string | null;
  live_url: string | null;
  status: string;
};

const emptyPost = {
  title: "",
  slug: "",
  content_type: "Blog",
  category: "Health Tips",
  excerpt: "",
  body: "",
  embed_url: "",
  status: "Draft",
  is_featured: false,
};

const emptyEvent = {
  title: "",
  starts_at: "",
  platform: "Facebook Live / YouTube Live",
  live_url: "",
  status: "Upcoming",
};

export default function CreatorContentPage() {
  const { accessToken } = useRole();
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [postForm, setPostForm] = useState(emptyPost);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [feedback, setFeedback] = useState("");

  const headers = useMemo(() => ({
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }), [accessToken]);

  async function load() {
    if (!accessToken) return;
    const [postsRes, eventsRes] = await Promise.all([
      fetch("/api/v2/content-posts", { headers, cache: "no-store" }),
      fetch("/api/v2/live-events", { headers, cache: "no-store" }),
    ]);
    if (postsRes.ok) setPosts((await postsRes.json()).posts ?? []);
    if (eventsRes.ok) setEvents((await eventsRes.json()).events ?? []);
  }

  useEffect(() => {
    void load();
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function createPost(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accessToken) return;
    const payload = { ...postForm, slug: postForm.slug || slugify(postForm.title) };
    const res = await fetch("/api/v2/content-posts", { method: "POST", headers, body: JSON.stringify(payload) });
    if (!res.ok) {
      setFeedback((await res.json()).message ?? "Unable to save post");
      return;
    }
    setPostForm(emptyPost);
    setFeedback("Content post saved.");
    await load();
  }

  async function createEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accessToken) return;
    const res = await fetch("/api/v2/live-events", { method: "POST", headers, body: JSON.stringify(eventForm) });
    if (!res.ok) {
      setFeedback((await res.json()).message ?? "Unable to save live event");
      return;
    }
    setEventForm(emptyEvent);
    setFeedback("Live event saved.");
    await load();
  }

  async function publish(post: Post) {
    await fetch(`/api/v2/content-posts/${post.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: post.status === "Published" ? "Draft" : "Published" }),
    });
    await load();
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[2rem] border border-sky-100 bg-linear-to-br from-sky-50 to-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">Doctor Creator Platform</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Blogs, videos, announcements, and live events</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Publish health tips, videos, clinic announcements, live replays, and webinar schedules that can convert followers into patients.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={<FaBullhorn />} title="Posts" value={posts.length} />
        <Metric icon={<FaVideo />} title="Published" value={posts.filter((p) => p.status === "Published").length} />
        <Metric icon={<FaCalendarDays />} title="Live Events" value={events.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={createPost} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Create content</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input required className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Title" value={postForm.title} onChange={(e) => setPostForm((s) => ({ ...s, title: e.target.value }))} />
              <input className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Slug" value={postForm.slug} onChange={(e) => setPostForm((s) => ({ ...s, slug: e.target.value }))} />
              <select className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" value={postForm.content_type} onChange={(e) => setPostForm((s) => ({ ...s, content_type: e.target.value }))}>
              {["Blog", "HealthTip", "Video", "Announcement", "LiveReplay"].map((type) => <option key={type}>{type}</option>)}
            </select>
            <select className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" value={postForm.category} onChange={(e) => setPostForm((s) => ({ ...s, category: e.target.value }))}>
              {["Health Tips", "Clinic Updates", "Medical Awareness", "Patient Education", "Online Consultation Topics", "Lifestyle & Wellness", "FAQ Videos", "Live Replays"].map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
          <input className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Embed URL for YouTube, TikTok, or Facebook video" value={postForm.embed_url} onChange={(e) => setPostForm((s) => ({ ...s, embed_url: e.target.value }))} />
          <textarea className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Excerpt" value={postForm.excerpt} onChange={(e) => setPostForm((s) => ({ ...s, excerpt: e.target.value }))} />
          <textarea className="mt-3 min-h-32 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Body / notes" value={postForm.body} onChange={(e) => setPostForm((s) => ({ ...s, body: e.target.value }))} />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" value={postForm.status} onChange={(e) => setPostForm((s) => ({ ...s, status: e.target.value }))}>
              {["Draft", "Published", "Archived"].map((type) => <option key={type}>{type}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={postForm.is_featured} onChange={(e) => setPostForm((s) => ({ ...s, is_featured: e.target.checked }))} /> Featured</label>
          </div>
          <button className="mt-4 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white">Save content</button>
        </form>

        <form onSubmit={createEvent} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Create live event</h2>
          <input required className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Title" value={eventForm.title} onChange={(e) => setEventForm((s) => ({ ...s, title: e.target.value }))} />
          <input required type="datetime-local" className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" value={eventForm.starts_at} onChange={(e) => setEventForm((s) => ({ ...s, starts_at: e.target.value }))} />
          <input className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Platform" value={eventForm.platform} onChange={(e) => setEventForm((s) => ({ ...s, platform: e.target.value }))} />
          <input className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100" placeholder="Live URL" value={eventForm.live_url} onChange={(e) => setEventForm((s) => ({ ...s, live_url: e.target.value }))} />
          <select className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" value={eventForm.status} onChange={(e) => setEventForm((s) => ({ ...s, status: e.target.value }))}>
            {["Upcoming", "Live", "Completed", "Cancelled"].map((type) => <option key={type}>{type}</option>)}
          </select>
          <button className="mt-4 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white">Save live event</button>
        </form>
      </div>

      {feedback ? <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">{feedback}</p> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Content library</h2>
        <div className="mt-4 grid gap-3">
          {posts.map((post) => (
            <div key={post.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold text-slate-950">{post.title}</p>
                <p className="text-sm text-slate-500">{post.content_type} - {post.category} - {post.status}</p>
              </div>
              <button onClick={() => publish(post)} className="rounded-full border border-sky-200 px-4 py-2 text-xs font-bold text-sky-700">
                {post.status === "Published" ? "Unpublish" : "Publish"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Live schedule</h2>
        <div className="mt-4 grid gap-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-bold text-slate-950">{event.title}</p>
              <p className="text-sm text-slate-500">{new Date(event.starts_at).toLocaleString()} - {event.platform ?? "Platform TBD"} - {event.status}</p>
            </div>
          ))}
        </div>
      </section>
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

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
