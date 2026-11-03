import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getArticleBySlug, getRelatedArticles } from "@/lib/queries";
import { getSettings, siteUrl } from "@/lib/settings";
import { stripHtml, truncate } from "@/lib/utils-text";
import { ArticleView } from "@/components/site/article-view";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article not found", robots: { index: false } };
  const settings = await getSettings();
  const description = article.excerpt || truncate(stripHtml(article.content), 160);
  const url = `/news/${article.slug}`;
  return {
    title: article.title,
    description,
    alternates: { canonical: url },
    authors: [{ name: settings.authorName }],
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description,
      siteName: settings.siteName,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      authors: [settings.authorName],
      section: article.category?.name,
      tags: article.tags.map((t) => t.name),
      images: article.featuredImage
        ? [{ url: article.featuredImage, alt: article.featuredImageCaption ?? article.title }]
        : undefined,
    },
    twitter: {
      card: article.featuredImage ? "summary_large_image" : "summary",
      title: article.title,
      description,
      images: article.featuredImage ? [article.featuredImage] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [related, settings] = await Promise.all([getRelatedArticles(article), getSettings()]);
  const url = `${siteUrl()}/news/${article.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt || truncate(stripHtml(article.content), 160),
    image: article.featuredImage ? [article.featuredImage] : undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: [{ "@type": "Person", name: settings.authorName, url: siteUrl() }],
    publisher: { "@type": "Organization", name: settings.siteName, url: siteUrl() },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: article.category?.name,
    keywords: article.tags.map((t) => t.name).join(", ") || undefined,
    contentLocation: article.eventLocation
      ? { "@type": "Place", name: article.eventLocation }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD must be inlined; escape "<" to prevent breaking out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ArticleView article={article} related={related} author={{ name: settings.authorName, bio: settings.authorBio, photo: settings.authorPhoto }} shareUrl={url} />
    </>
  );
}
