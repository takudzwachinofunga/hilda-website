import type { Metadata } from "next";

import { db } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/ui";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });
  return (
    <>
      <AdminPageHeader title="Categories" description="Organise articles into sections readers can filter by." />
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description ?? "",
          count: c._count.articles,
        }))}
      />
    </>
  );
}
