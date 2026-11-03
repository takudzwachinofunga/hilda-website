import type { Metadata } from "next";

import { db } from "@/lib/db";
import { EventForm } from "@/components/admin/event-form";

export const metadata: Metadata = { title: "New event" };

export default async function NewEventPage() {
  const allArticles = await db.article.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, eventId: true },
  });
  return (
    <EventForm
      allArticles={allArticles}
      event={{
        title: "",
        slug: "",
        description: "",
        location: "",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: "",
        coverImage: null,
        articles: [],
        media: [],
      }}
    />
  );
}
