import { useState } from "react";
import { DishThumb } from "./dish-thumb";

/** Only the current Dish projection supplies the URL; never reuse another Dish's photo. */
export function canonicalDishPhotoUrl(value: string | null | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

export function MenuDishPhoto({
  photoUrl,
  placeholder,
  emoji,
}: {
  photoUrl?: string | null;
  placeholder?: string;
  emoji: string;
}) {
  const source = canonicalDishPhotoUrl(photoUrl);
  // Remount failure state when a different Dish/photo or placeholder is projected.
  return (
    <PhotoFrame
      key={JSON.stringify([source, placeholder])}
      source={source}
      placeholder={placeholder}
      emoji={emoji}
    />
  );
}

function PhotoFrame({
  source,
  placeholder,
  emoji,
}: {
  source?: string;
  placeholder?: string;
  emoji: string;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const image = [source, placeholder].find((url) => url && !failed.includes(url));
  return (
    <DishThumb
      emoji={emoji}
      imageSrc={image}
      size="hero"
      className="!rounded-[1.75rem] border-0 shadow-sm"
      onImageError={() => {
        if (image) setFailed((previous) => [...previous, image]);
      }}
    />
  );
}
