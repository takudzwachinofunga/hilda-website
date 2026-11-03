import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";

import { db } from "@/lib/db";
import { getArticleFormOptions, mediaDTO } from "@/lib/admin-data";
import { formatDate, toDateInput } from "@/lib/utils-text";
import { deleteArticle } from "@/app/admin/actions/articles";
import { ArticleForm } from "@/components/admin/article-form";
import { ConfirmAction } from "@/components/admin/ui";
import { SavedNotice } from "@/components/admin/saved-notice";

export const metadata: Metadata = { title: "Edit article" };

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const [article, options] = await Promise.all([
    db.article.findUnique({
      where: { id },
      include: { tags: { orderBy: { name: "asc" } }, galleryImages: true },
    }),
    getArticleFormOptions(),
  ]);
  if (!article) notFound();

  return (
    <>
      <SavedNotice
        message={saved === "published" ? "Article published." : saved === "draft" ? "Draft saved." : undefined}
      />
      <ArticleForm
        categories={options.categories}
        events={options.events}
        article={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          featuredImage: article.featuredImage,
          featuredImageCaption: article.featuredImageCaption,
          videoUrl: article.videoUrl,
          categoryId: article.categoryId,
          eventId: article.eventId,
          eventDate: toDateInput(article.eventDate),
          eventLocation: article.eventLocation,
          publishedAt: toDateInput(article.publishedAt),
          status: article.status,
          isFeatured: article.isFeatured,
          tags: article.tags.map((t) => t.name).join(", "),
          gallery: article.galleryImages.map(mediaDTO),
        }}
      />
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-sm text-muted">
        <span>
          Created {formatDate(article.createdAt)} · Last updated {formatDate(article.updatedAt)}
          {article.status === "PUBLISHED" && (
            <>
              {" · "}
              <Link href={`/news/${article.slug}`} target="_blank" className="inline-flex items-center gap-1 text-brand hover:underline">
                View live <ExternalLink className="size-3" />
              </Link>
            </>
          )}
        </span>
        <ConfirmAction
          action={deleteArticle}
          fields={{ id: article.id, redirect: "list" }}
          title="Delete this article?"
          description="This cannot be undone. Photos in the media library are kept."
          variant="outline"
          className="text-brand"
        >
          <Trash2 className="size-4" /> Delete article
        </ConfirmAction>
      </div>
    </>
  );
}
