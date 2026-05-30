import type { PublicContentPost } from "@/src/lib/services/content-posts";
import { getPublishedContentPosts } from "@/src/lib/services/content-posts";
import { contentCategories } from "@/src/lib/healthcare-content";
import BlogBlockRenderer from "@/src/components/blog/BlogBlockRenderer";
import PublicHeader from "@/src/components/layout/PublicHeader";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";

export default async function ArticleTemplate({ post }: { post: PublicContentPost }) {
  const recent = await getPublishedContentPosts(6);
  const publishedDateObj = new Date(post.published_at ?? post.created_at);
  const publishedDay = String(publishedDateObj.getDate()).padStart(2, "0");
  const publishedMonthShort = publishedDateObj.toLocaleString(undefined, { month: "short" }).toUpperCase();

  return (
    <>
      <PublicHeader />

      <article className="mx-auto max-w-7xl px-4 pt-20 pb-10 sm:px-6 sm:pt-24 sm:pb-14">
        <div className="mb-8 border-b border-slate-200 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-slate-500">
              <Link href="/blog" className="transition hover:text-sky-700">
                Blog
              </Link>
              <span className="px-2 text-slate-400">/</span>
              <span className="text-slate-700">{post.title}</span>
            </div>

            <Link
              href="/#blog"
              className="inline-flex items-center gap-2 self-start rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-bold text-sky-800 transition hover:bg-sky-50"
            >
              <FaArrowLeft />
              Back to blog preview
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.35fr]">
          <main>
            {post.thumbnail_url ? (
              <div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
                <img src={post.thumbnail_url} alt={post.title} className="h-72 w-full object-cover sm:h-96" />
              </div>
            ) : null}

            <div className="flex gap-8">
              <div className="hidden shrink-0 lg:block">
                <div className="flex w-24 flex-col items-center justify-center rounded-[1.5rem] bg-sky-700 px-3 py-4 text-white shadow-lg shadow-sky-900/15">
                  <div className="text-3xl font-extrabold leading-none">{publishedDay}</div>
                  <div className="mt-1 text-xs font-semibold tracking-wider">{publishedMonthShort}</div>
                </div>
              </div>

              <div className="flex-1">
                <div className="inline-flex rounded-full bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-800">
                  {post.category}
                </div>
                <h1 className="mt-5 text-4xl font-black tracking-tight text-sky-900 sm:text-5xl">{post.title}</h1>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span>By Doctor Kulot Clinic</span>
                  <span>{post.category}</span>
                </div>

                <p className="mt-6 text-lg leading-8 text-slate-600">{post.excerpt}</p>

                <div className="mt-8">
                  <Link
                    href="/#booking"
                    className="inline-flex w-full max-w-md rounded-full bg-sky-700 px-6 py-3 text-center text-base font-semibold text-white shadow-sm transition hover:bg-sky-600"
                  >
                    Book An Appointment
                  </Link>
                </div>

                <div className="mt-10 space-y-7">
                  {Array.isArray(post.blocks) && post.blocks.length ? (
                    <BlogBlockRenderer blocks={post.blocks} title={post.title} />
                  ) : (post.body ?? '').trim() ? (
                    (post.body as string)
                      .split(/\n\s*\n/)
                      .map((block, index) => (
                        <p key={index} className="text-base leading-8 text-slate-700 sm:text-lg">
                          {block}
                        </p>
                      ))
                  ) : (
                    <p className="text-base leading-8 text-slate-600">
                      This article is ready for clinic content. Publish blocks from the creator dashboard to see them here.
                    </p>
                  )}
                </div>

                <div className="mt-10 rounded-[1.75rem] border border-sky-100 bg-sky-50 px-6 py-5 text-sm leading-6 text-sky-900">
                  Health content is for education only. If symptoms are urgent, seek care immediately.
                </div>
              </div>
            </div>
          </main>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-sky-100 bg-sky-50 p-6 shadow-sm">
              <h3 className="text-lg font-black tracking-tight text-sky-800">Categories</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {contentCategories.map((c) => (
                  <li key={c} className="border-b border-sky-100 py-3 hover:text-sky-700">
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black tracking-tight text-sky-800">Recent</h3>
              <div className="mt-4 space-y-4">
                {recent.slice(0, 4).map((r) => (
                  <Link key={r.id} href={`/blog/${r.slug}`} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50">
                    {r.thumbnail_url ? (
                      <img src={r.thumbnail_url} alt={r.title} className="h-14 w-14 rounded-2xl object-cover shrink-0" />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-[10px] font-bold uppercase text-slate-500">
                        Blog
                      </div>
                    )}
                    <div className="text-sm min-w-0">
                      <div className="font-semibold text-slate-900 line-clamp-2">{r.title}</div>
                      <div className="text-xs text-slate-500">{new Date(r.published_at ?? r.created_at).toLocaleDateString()}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
