import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, History, SkipForward } from 'lucide-react';
import { ACTIONS_IN_BUTTON_ORDER, getActionByDirection, type SwipeDirection } from '../config/actions';
import {
  addChoice,
  getSavedIndex,
  getSavedOrder,
  setSavedIndex,
  setSavedOrder,
} from '../services/storage';
import type { Character, DeckFilter } from '../types/character';
import ActionButton from './ActionButton';
import CharacterCard, { type CharacterCardHandle } from './CharacterCard';
import SkeletonCard from './SkeletonCard';

interface GameScreenProps {
  characters: Character[];
  filterLabel: string;
  filterId: DeckFilter;
  sourceId: string;
  onBack: () => void;
  onHistory: () => void;
  onExhausted: () => void;
  exhausted: boolean;
  onMarkSeen: (characterId: number) => void;
}

const KEY_TO_DIRECTION: Record<string, SwipeDirection> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
};

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function resolveOrder(sourceId: string, filterId: DeckFilter, characters: Character[]): number[] {
  const currentIds = characters.map((c) => c.id);
  const currentSet = new Set(currentIds);
  const saved = getSavedOrder(sourceId, filterId);

  if (saved) {
    const valid = saved.filter((id) => currentSet.has(id));
    const savedSet = new Set(valid);
    const additions = shuffleArray(currentIds.filter((id) => !savedSet.has(id)));

    if (additions.length === 0 && valid.length === saved.length) return saved;

    const merged = [...valid, ...additions];
    setSavedOrder(sourceId, filterId, merged);
    return merged;
  }

  const shuffled = shuffleArray(currentIds);
  setSavedOrder(sourceId, filterId, shuffled);
  return shuffled;
}

export default function GameScreen({
  characters,
  filterLabel,
  filterId,
  sourceId,
  onBack,
  onHistory,
  onExhausted,
  exhausted,
  onMarkSeen,
}: GameScreenProps) {
  const charMap = useMemo(() => {
    const m = new Map<number, Character>();
    for (const c of characters) m.set(c.id, c);
    return m;
  }, [characters]);

  const [orderIds, setOrderIds] = useState<number[]>(() =>
    resolveOrder(sourceId, filterId, characters)
  );
  const lastKey = useRef<string>(`${sourceId}:${filterId}:${characters.length}`);
  const alreadyTriggered = useRef(false);

  useEffect(() => {
    const key = `${sourceId}:${filterId}:${characters.length}:${characters
      .slice(0, 5)
      .map((c) => c.id)
      .join(',')}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    const next = resolveOrder(sourceId, filterId, characters);
    setOrderIds(next);
    alreadyTriggered.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId, filterId, characters]);

  const [index, setIndex] = useState<number>(() => {
    const saved = getSavedIndex(sourceId, filterId);
    return saved < orderIds.length ? saved : 0;
  });
  const cardRef = useRef<CharacterCardHandle>(null);

  useEffect(() => {
    const saved = getSavedIndex(sourceId, filterId);
    setIndex(saved < orderIds.length ? saved : 0);
    alreadyTriggered.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId, filterId]);

  useEffect(() => {
    setSavedIndex(sourceId, filterId, index);
  }, [sourceId, filterId, index]);

  const current = charMap.get(orderIds[index]);
  const next = charMap.get(orderIds[index + 1]);
  const finished = orderIds.length > 0 && index >= orderIds.length;

  useEffect(() => {
    orderIds.slice(index + 1, index + 4).forEach((id) => {
      const c = charMap.get(id);
      if (c?.imageUrl) {
        const img = new Image();
        img.src = c.imageUrl;
      }
    });
  }, [orderIds, index, charMap]);

  useEffect(() => {
    if (finished && !exhausted && !alreadyTriggered.current) {
      alreadyTriggered.current = true;
      onExhausted();
    }
  }, [finished, exhausted, onExhausted]);

  const handleAction = useCallback(
    (actionId: string) => {
      if (!current) return;
      addChoice(sourceId, {
        characterId: current.id,
        name: current.name,
        imageUrl: current.imageUrl,
        actionId,
        timestamp: Date.now(),
      });
      onMarkSeen(current.id);
      setIndex((i) => i + 1);
    },
    [current, sourceId, onMarkSeen]
  );

  const handleSkip = useCallback(() => {
    if (current) onMarkSeen(current.id);
    setIndex((i) => i + 1);
  }, [current, onMarkSeen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!cardRef.current) return;
      const dir = KEY_TO_DIRECTION[e.key];
      if (dir) {
        const action = getActionByDirection(dir);
        if (action) {
          e.preventDefault();
          cardRef.current.swipeAction(action.id);
        }
      } else if (e.key === ' ' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        cardRef.current.skip();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (orderIds.length === 0 && exhausted) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-5 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]"
          >
            <span className="text-2xl text-white/40">◌</span>
          </motion.div>
          <h2 className="font-display text-3xl leading-tight text-white">That's everyone</h2>
          <p className="max-w-xs text-sm font-light text-white/40">
            You've gone through the entire deck.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onBack}
            className="mt-2 rounded-full border border-white/15 bg-white/[0.03] px-5 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.07]"
          >
            Back to filters
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (finished && !exhausted) {
    return (
      <div className="flex h-full flex-col px-4 pb-4 pt-3">
        <header className="flex items-center justify-center">
          <div>
            <h1 className="font-display text-2xl leading-none tracking-tight text-white">
              AniMatch
            </h1>
            <p className="mt-1 text-center text-[10px] font-light uppercase tracking-[0.25em] text-white/40">
              Finding more…
            </p>
          </div>
        </header>
        <SkeletonCard />
        <div className="flex items-start justify-center gap-5 opacity-30 sm:gap-7">
          <div className="h-16 w-16 rounded-full border border-white/10 bg-white/[0.03]" />
          <div className="h-16 w-16 rounded-full border border-white/10 bg-white/[0.03]" />
          <div className="h-16 w-16 rounded-full border border-white/10 bg-white/[0.03]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-4 pb-4 pt-3">
      <header className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-full p-2 text-white/60 transition hover:bg-white/[0.06] hover:text-white"
          aria-label="Back to deck selection"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="font-display text-2xl leading-none tracking-tight text-white">AniMatch</h1>
          <p className="mt-1 text-[10px] font-light uppercase tracking-[0.25em] text-white/40">
            {filterLabel} · {Math.min(index + 1, orderIds.length)}/{orderIds.length}
          </p>
        </div>
        <button
          onClick={onHistory}
          className="rounded-full p-2 text-white/60 transition hover:bg-white/[0.06] hover:text-white"
          aria-label="History"
        >
          <History size={20} />
        </button>
      </header>

      <div className="relative my-3 flex min-h-0 flex-1 items-center justify-center">
        <div className="relative h-full max-h-[560px] w-full max-w-[380px]">
          {next && (
            <motion.div
              key={`back-${next.id}`}
              className="absolute inset-0"
              initial={{ scale: 0.88, y: 24, opacity: 0 }}
              animate={{ scale: 0.94, y: 14, opacity: 0.7 }}
              transition={{ duration: 0.3 }}
            >
              <CharacterCard character={next} isTop={false} onAction={() => {}} onSkip={() => {}} />
            </motion.div>
          )}
          {current && (
            <motion.div
              key={`top-${current.id}`}
              className="absolute inset-0"
              initial={{ scale: 0.94, y: 14, opacity: 0.7 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            >
              <CharacterCard
                ref={cardRef}
                character={current}
                isTop
                onAction={handleAction}
                onSkip={handleSkip}
              />
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex items-start justify-center gap-5 sm:gap-7">
        {ACTIONS_IN_BUTTON_ORDER.map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            onClick={() => cardRef.current?.swipeAction(action.id)}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-col items-center gap-1">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => cardRef.current?.skip()}
          className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-light uppercase tracking-[0.2em] text-white/40 transition hover:bg-white/[0.05] hover:text-white/80"
        >
          <SkipForward size={13} /> Skip
        </motion.button>
        <p className="hidden text-[10px] font-light uppercase tracking-[0.15em] text-white/25 sm:block">
          Arrows to choose · S or Space to skip
        </p>
      </div>
    </div>
  );
}