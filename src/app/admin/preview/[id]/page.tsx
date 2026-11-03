import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getArticleBySlug, getRelatedArticles } from "@/lib/queries";
import { getSettings, siteUrl } from "@/lib/settings";
import { ArticleView } from "@/components/site/article-view";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const row = await db.article.findUnique({ where: { id }, select: { slug: true } });
  if (!row) notFound();
  const article = await getArticleBySlug(row.slug, { includeDrafts: true });
  if (!article) notFound();
  const [related, settings] = await Promise.all([getRelatedArticles(article), getSettings()]);

  return (
    <div className="bg-white">
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 bg-brand px-4 py-2.5 text-sm text-white">
        <span className="font-semibold">
          Preview · {article.status === "PUBLISHED" ? "Published" : "Draft — not visible to the public"}
        </span>
        <Link
          href={`/admin/articles/${article.id}/edit`}
          className="inline-flex items-center gap-1.5 rounded bg-white/15 px-3 py-1 font-medium hover:bg-white/25"
        >
          <ArrowLeft className="size-4" /> Back to editor
        </Link>
      </div>
      <SiteHeader />
      <ArticleView
        article={article}
        related={related}
        author={{ name: settings.authorName, bio: settings.authorBio, photo: settings.authorPhoto }}
        shareUrl={`${siteUrl()}/news/${article.slug}`}
      />
      <SiteFooter />
    </div>
  );
}
