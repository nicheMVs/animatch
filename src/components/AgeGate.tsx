import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STORAGE_KEY = 'animatch_age_verified';
const EXPIRY_DAYS = 30;

function isVerified(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const { timestamp } = JSON.parse(raw);
    const ageMs = Date.now() - timestamp;
    return ageMs < EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

interface AgeGateProps {
  children: React.ReactNode;
}

export default function AgeGate({ children }: AgeGateProps) {
  const [verified, setVerified] = useState<boolean>(() => isVerified());

  useEffect(() => {
    if (verified) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now() }));
    }
  }, [verified]);

  if (verified) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f] px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm"
      >
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl text-white">Age Verification</h1>
          <p className="mt-3 text-sm font-light text-white/50">
            This site contains adult content. You must be 18 or older to enter.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setVerified(true)}
            className="w-full rounded-xl border border-white/15 bg-white/[0.04] py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.08]"
          >
            I am 18 or older
          </button>
          <button
            onClick={() => {
              window.location.href = 'https://www.google.com';
            }}
            className="w-full rounded-xl border border-white/[0.06] bg-transparent py-3 text-sm font-light text-white/40 transition hover:border-white/15 hover:text-white/60"
          >
            I am under 18 — Exit
          </button>
        </div>

        <p className="mt-6 text-center text-[10px] font-light uppercase tracking-wider text-white/20">
          By entering, you confirm you are of legal age in your jurisdiction.
        </p>
      </motion.div>
    </div>
  );
}