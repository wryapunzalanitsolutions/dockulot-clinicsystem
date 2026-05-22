import { featuredContent } from "@/src/lib/healthcare-content";

export default function BlogPage() {
  const posts = featuredContent.filter((item) => item.type === "Blog" || item.type === "Announcement");
  return (
    <main className="min-h-screen bg-white px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-700">Blog / Health Tips</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Health education content</h1>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {posts.map((post) => (
            <article key={post.title} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">{post.category}</span>
              <h2 className="mt-3 text-xl font-bold text-slate-950">{post.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{post.description}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
