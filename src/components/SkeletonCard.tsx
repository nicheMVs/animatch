import { motion } from 'framer-motion';

export default function SkeletonCard() {
  return (
    <div className="relative mx-auto my-3 flex min-h-0 flex-1 items-center justify-center">
      <div className="relative h-full max-h-[560px] w-full max-w-[380px]">
        <motion.div
          className="absolute inset-0 overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02]"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)',
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Placeholder blocks mimicking the card layout */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="mb-3 h-8 w-2/3 rounded-lg bg-white/[0.04]" />
            <div className="h-3 w-1/3 rounded bg-white/[0.03]" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}