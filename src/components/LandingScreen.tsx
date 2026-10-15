import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';

interface LandingScreenProps {
  onSelect: (source: 'anilist' | 'gelbooru') => void;
}

const SOURCES = [
  {
    id: 'anilist' as const,
    title: 'AniMatch',
    subtitle: 'Anime characters from AniList',
    tagline: 'Kiss · Marry · Kill',
    icon: Heart,
    enabled: true,
  },
  {
    id: 'gelbooru' as const,
    title: 'BooruMatch',
    subtitle: 'Booru characters from Gelbooru',
    tagline: 'Kiss · Marry · Kill',
    icon: Sparkles,
    enabled: false,
  },
];

export default function LandingScreen({ onSelect }: LandingScreenProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 flex flex-col items-center text-center"
      >
        <div className="mb-6 flex items-center gap-4 text-white/30">
          <Heart size={20} strokeWidth={1.5} />
          <Sparkles size={20} strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-6xl leading-none tracking-tight text-white">Match</h1>
        <p className="mt-3 text-xs font-light uppercase tracking-[0.35em] text-white/40">
          Choose your deck
        </p>
      </motion.div>

      <div className="w-full max-w-sm space-y-4">
        {SOURCES.map((src, i) => {
          const Icon = src.icon;
          return (
            <motion.button
              key={src.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
              whileHover={src.enabled ? { scale: 1.02 } : undefined}
              whileTap={src.enabled ? { scale: 0.98 } : undefined}
              onClick={() => src.enabled && onSelect(src.id)}
              disabled={!src.enabled}
              className={`group flex w-full items-start gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-5 text-left backdrop-blur-sm transition-colors ${
                src.enabled
                  ? 'hover:border-white/[0.18] hover:bg-white/[0.05]'
                  : 'cursor-not-allowed opacity-40'
              }`}
            >
              <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition-colors group-hover:border-white/25 group-hover:text-white">
                <Icon size={22} strokeWidth={1.5} />
              </span>
              <span className="flex-1">
                <span className="block text-lg font-medium text-white">{src.title}</span>
                <span className="mt-0.5 block text-xs font-light text-white/40">
                  {src.subtitle}
                </span>
                <span className="mt-2 block text-[10px] font-light uppercase tracking-[0.2em] text-white/30">
                  {src.tagline}
                </span>
              </span>
              {src.enabled && (
                <span className="mt-1 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-white/50">
                  →
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}