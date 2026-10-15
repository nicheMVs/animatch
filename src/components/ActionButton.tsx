import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActionConfig } from '../config/actions';

interface ActionButtonProps {
  action: ActionConfig;
  onClick: () => void;
  disabled?: boolean;
  size?: number;
}

export default function ActionButton({ action, onClick, disabled, size = 64 }: ActionButtonProps) {
  const [pulseKey, setPulseKey] = useState(0);
  const Icon = action.icon;

  const handleClick = () => {
    setPulseKey((k) => k + 1);
    onClick();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        aria-label={action.label}
        className="group relative flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-30"
        style={{ width: size, height: size }}
      >
        {/* Hover glow */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            boxShadow: `0 0 24px -4px ${action.color}66, inset 0 0 12px -4px ${action.color}44`,
          }}
        />

        {/* Tap pulse — keyed by pulseKey so it re-triggers every click */}
        <AnimatePresence>
          {pulseKey > 0 && (
            <motion.span
              key={pulseKey}
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ border: `1.5px solid ${action.color}` }}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        <Icon
          size={size * 0.4}
          strokeWidth={1.5}
          className="relative z-10 text-white/80 transition-colors duration-200 group-hover:text-white"
        />
      </motion.button>
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/40 transition-colors group-hover:text-white/70">
        {action.label}
      </span>
    </div>
  );
}