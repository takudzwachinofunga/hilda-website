import type { Metadata } from "next";

import { getArticleFormOptions } from "@/lib/admin-data";
import { ArticleForm } from "@/components/admin/article-form";

export const metadata: Metadata = { title: "New article" };

export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const [{ categories, events }, { event }] = await Promise.all([getArticleFormOptions(), searchParams]);
  const preset = events.find((e) => e.id === event);

  return (
    <ArticleForm
      categories={categories}
      events={events}
      article={{
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        featuredImage: null,
        featuredImageCaption: null,
        videoUrl: null,
        categoryId: categories.find((c) => c.name === "News")?.id ?? null,
        eventId: preset?.id ?? null,
        eventDate: preset?.startDate ?? "",
        eventLocation: preset?.location ?? null,
        publishedAt: "",
        status: "DRAFT",
        isFeatured: false,
        tags: "",
        gallery: [],
      }}
    />
  );
}
