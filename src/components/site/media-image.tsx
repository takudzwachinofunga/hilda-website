import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
};

/** Fills its (relatively positioned) parent with a cover-cropped image, or a neutral placeholder. */
export function MediaImage({ src, alt, sizes, className, imgClassName, priority }: Props) {
  return (
    <div className={cn("relative overflow-hidden bg-paper", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imgClassName)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-3xl italic text-line">No image</span>
        </div>
      )}
    </div>
  );
}
