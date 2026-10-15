import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface LandingScreenProps {
  onEnter: () => void;
}

export default function LandingScreen({ onEnter }: LandingScreenProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 flex flex-col items-center text-center"
      >
        <div className="mb-6 flex items-center gap-4 text-white/30">
          <Heart size={22} strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-6xl leading-none tracking-tight text-white">AniMatch</h1>
        <p className="mt-3 text-xs font-light uppercase tracking-[0.35em] text-white/40">
          Fuck · Marry · Kill
        </p>
      </motion.div>

      <div className="w-full max-w-sm">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEnter}
          className="group flex w-full items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-5 text-left backdrop-blur-sm transition-colors hover:border-white/[0.18] hover:bg-white/[0.05]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition-colors group-hover:border-white/25 group-hover:text-white">
            <Heart size={22} strokeWidth={1.5} />
          </span>
          <span className="flex-1">
            <span className="block text-lg font-medium text-white">AniMatch</span>
            <span className="mt-0.5 block text-xs font-light text-white/40">
              Anime characters from AniList
            </span>
          </span>
          <span className="text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-white/50">
            →
          </span>
        </motion.button>
      </div>
    </div>
  );
}