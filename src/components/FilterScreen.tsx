import { motion } from 'framer-motion';
import { ArrowLeft, History, Heart, Sword, Sparkles } from 'lucide-react';
import { ACTIONS } from '../config/actions';
import type { DeckFilter } from '../types/character';
import type { FilterOption } from '../sources/types';

interface FilterScreenProps {
  sourceName: string;
  sourceFilters: FilterOption[];
  onSelect: (filter: DeckFilter) => void;
  onHistory: () => void;
  onBack: () => void;
  loadingHint?: string | null;
}

const ICONS: Record<string, typeof Heart> = {
  waifus: Heart,
  husbandos: Sword,
  both: Sparkles,
};

export default function FilterScreen({
  sourceName,
  sourceFilters,
  onSelect,
  onHistory,
  onBack,
  loadingHint,
}: FilterScreenProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center px-6">
      <header className="absolute top-4 left-0 right-0 flex items-center justify-between px-4">
        <button
          onClick={onBack}
          className="rounded-full p-2 text-white/50 transition hover:bg-white/5 hover:text-white"
          aria-label="Back to source selection"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={onHistory}
          className="rounded-full p-2 text-white/50 transition hover:bg-white/5 hover:text-white"
          aria-label="History"
        >
          <History size={20} />
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 flex flex-col items-center text-center"
      >
        <div className="mb-6 flex items-center gap-4 text-white/30">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return <Icon key={a.id} size={20} strokeWidth={1.5} />;
          })}
        </div>
        <h1 className="font-display text-6xl leading-none tracking-tight text-white">{sourceName}</h1>
        <p className="mt-3 text-xs font-light uppercase tracking-[0.35em] text-white/40">
          Fuck · Marry · Kill
        </p>
      </motion.div>

      <div className="w-full max-w-sm space-y-3">
        {sourceFilters.map((opt, i) => {
          const Icon = ICONS[opt.id] ?? Sparkles;
          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(opt.id)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 text-left backdrop-blur-sm transition-colors hover:border-white/[0.18] hover:bg-white/[0.05]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition-colors group-hover:border-white/25 group-hover:text-white">
                <Icon size={18} strokeWidth={1.5} />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-medium text-white">{opt.label}</span>
                <span className="block text-xs font-light text-white/40">{opt.subtitle}</span>
              </span>
              <span className="text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-white/50">
                →
              </span>
            </motion.button>
          );
        })}
      </div>

      {loadingHint && (
        <p className="mt-8 text-xs font-light tracking-wide text-white/30">{loadingHint}</p>
      )}
    </div>
  );
}