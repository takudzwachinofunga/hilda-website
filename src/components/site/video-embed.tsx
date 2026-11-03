import { getVideoEmbed } from "@/lib/video";

export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const embed = getVideoEmbed(url);
  if (!embed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand underline">
        Watch the video
      </a>
    );
  }
  return (
    <div className="aspect-video w-full bg-ink">
      {embed.kind === "iframe" ? (
        <iframe
          src={embed.src}
          title={title}
          loading="lazy"
          className="size-full"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video src={embed.src} poster={embed.poster} controls preload="metadata" className="size-full" />
      )}
    </div>
  );
}
