import { notFound } from "next/navigation";
import ArticleTemplate from "@/src/components/blog/ArticleTemplate";
import { getPublishedContentPostBySlug } from "@/src/lib/services/content-posts";

export const revalidate = 60; // Cache for 1 minute

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPublishedContentPostBySlug(slug);
  if (!post) return notFound();

  return <ArticleTemplate post={post} />;
}
