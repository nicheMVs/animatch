import { motion } from 'framer-motion';

export default function SkeletonCard() {
  return (
    <div className="relative mx-auto my-3 flex min-h-0 flex-1 items-center justify-center">
      <div className="relative h-full max-h-[560px] w-full max-w-[380px]">
        <motion.div
          className="absolute inset-0 overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02]"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Placeholder text blocks at the bottom, matching the real card's layout */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <motion.div
              className="mb-3 h-8 w-2/3 rounded-lg bg-white/[0.05]"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="h-3 w-1/3 rounded bg-white/[0.04]"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}