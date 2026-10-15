interface PlaceholderImageProps {
  name: string;
}

/** Shown when a character has no image or the image fails to load. */
export default function PlaceholderImage({ name }: PlaceholderImageProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#2a2238] to-[#15111e] px-6 text-center">
      <svg viewBox="0 0 120 140" className="h-1/2 max-h-48 w-auto opacity-40" aria-hidden="true">
        <circle cx="60" cy="42" r="26" fill="#cbbbe0" />
        <path d="M14 136c0-30 20-52 46-52s46 22 46 52z" fill="#cbbbe0" />
      </svg>
      <p className="mt-4 text-lg font-semibold text-white/70">{name}</p>
      <p className="mt-1 text-xs uppercase tracking-widest text-white/35">No image available</p>
    </div>
  );
}
