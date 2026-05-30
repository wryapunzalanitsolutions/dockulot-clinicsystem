import BlogIndex from "@/src/components/blog/BlogIndex";
import type { PublicContentPost } from "@/src/lib/services/content-posts";

export default function InlineArticleBrowser({
  posts,
  categories,
  labels,
}: {
  posts: PublicContentPost[];
  categories: string[];
  labels?: {
    categoriesTitle?: string;
    recentPostsTitle?: string;
    browseAllLabel?: string;
  };
}) {
  return <BlogIndex posts={posts} categories={categories} mode="landing" labels={labels} />;
}
