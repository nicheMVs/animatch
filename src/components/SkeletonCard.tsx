import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface SkeletonCardProps {
  label?: string;
}

export default function SkeletonCard({ label = 'Loading' }: SkeletonCardProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="mb-6"
      >
        <Sparkles size={36} className="text-rose-300" strokeWidth={1.2} />
      </motion.div>

      <p className="font-display text-2xl leading-tight text-white">{label}</p>

      <p className="mt-2 text-[10px] font-light uppercase tracking-[0.3em] text-white/40">
        AniMatch
      </p>

      <div className="mt-8 h-[3px] w-40 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full w-1/3 rounded-full bg-rose-300/80"
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}