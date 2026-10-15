import { motion } from 'framer-motion';

export default function SkeletonCard() {
  return (
    <div className="relative mx-auto my-3 flex min-h-0 flex-1 items-center justify-center">
      <div className="relative h-full max-h-[560px] w-full max-w-[380px]">
        <div className="absolute inset-0 overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02]">
          {/* Pulsing tint */}
          <motion.div
            className="absolute inset-0 bg-white/[0.02]"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Shimmer sweep — clipped by the parent's overflow-hidden */}
          <motion.div
            className="absolute inset-y-0 w-1/2"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
            }}
            animate={{ x: ['-100%', '250%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Placeholder layout blocks */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <motion.div
              className="mb-3 h-8 w-2/3 rounded-lg bg-white/[0.04]"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="h-3 w-1/3 rounded bg-white/[0.03]"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}