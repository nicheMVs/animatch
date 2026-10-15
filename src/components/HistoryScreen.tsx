import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, User } from 'lucide-react';
import { getActionById } from '../config/actions';
import { clearAll, getHistory } from '../services/storage';
import type { Choice } from '../types/choice';
import ActionFilterTabs from './ActionFilterTabs';

interface HistoryScreenProps {
  sourceId: string;
  onBack: () => void;
}

function Thumb({ choice }: { choice: Choice }) {
  const [failed, setFailed] = useState(false);
  if (!choice.imageUrl || failed) {
    return (
      <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
        <User size={18} className="text-white/30" />
      </div>
    );
  }
  return (
    <img
      src={choice.imageUrl}
      alt={choice.name}
      onError={() => setFailed(true)}
      loading="lazy"
      className="h-14 w-11 shrink-0 rounded-lg object-cover"
    />
  );
}

export default function HistoryScreen({ sourceId, onBack }: HistoryScreenProps) {
  const [history] = useState<Choice[]>(() => getHistory(sourceId).slice().reverse());
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    history.forEach((c) => (map[c.actionId] = (map[c.actionId] ?? 0) + 1));
    return map;
  }, [history]);

  const filtered = useMemo(
    () => (activeFilter === 'all' ? history : history.filter((c) => c.actionId === activeFilter)),
    [history, activeFilter]
  );

  const handleClear = () => {
    if (window.confirm("Clear history and reset the deck? You'll get a fresh shuffle next time.")) {
      clearAll(sourceId);
      window.location.reload();
    }
  };

  return (
    <div className="flex h-full flex-col px-4 pb-4 pt-3">
      <header className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-full p-2 text-white/50 transition hover:bg-white/5 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-2xl leading-none text-white">History</h1>
        <button
          onClick={handleClear}
          className="rounded-full p-2 text-white/50 transition hover:bg-red-500/10 hover:text-red-300"
          aria-label="Clear history and reset deck"
        >
          <Trash2 size={18} />
        </button>
      </header>

      <ActionFilterTabs
        activeId={activeFilter}
        counts={counts}
        totalCount={history.length}
        onChange={setActiveFilter}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-3 text-2xl text-white/20">◌</p>
          <p className="text-sm font-light text-white/40">
            {history.length === 0 ? 'No choices yet.' : 'Nothing in this filter yet.'}
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {filtered.map((choice, i) => {
              const action = getActionById(choice.actionId);
              return (
                <motion.li
                  key={`${choice.timestamp}-${choice.characterId}`}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, delay: Math.min(i * 0.01, 0.15) }}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-2"
                >
                  <Thumb choice={choice} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{choice.name}</p>
                    <p className="text-[11px] font-light text-white/35">
                      {new Date(choice.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {action && (
                    <span
                      className="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider"
                      style={{
                        color: action.color,
                        borderColor: `${action.color}44`,
                        backgroundColor: `${action.color}11`,
                      }}
                    >
                      <action.icon size={11} strokeWidth={2} />
                      {action.label}
                    </span>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}