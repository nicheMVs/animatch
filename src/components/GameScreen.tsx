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

interface GameScreenProps {
  characters: Character[];
  filterLabel: string;
  filterId: DeckFilter;
  sourceId: string;
  onBack: () => void;
  onHistory: () => void;
  onExhausted: () => void;
  exhausted: boolean;
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

/**
 * Build (or restore) the shuffled order for this filter.
 * The order is saved to localStorage so it survives refreshes.
 * Only regenerated when the saved order no longer matches the character set.
 */
function resolveOrder(
  sourceId: string,
  filterId: DeckFilter,
  characters: Character[]
): number[] {
  const currentIds = characters.map((c) => c.id);
  const currentSet = new Set(currentIds);

  const saved = getSavedOrder(sourceId, filterId);

  if (saved) {
    // Keep only the IDs that still exist in the character set
    const valid = saved.filter((id) => currentSet.has(id));
    // Any new IDs not already in the saved order get appended (shuffled)
    const savedSet = new Set(valid);
    const additions = shuffleArray(currentIds.filter((id) => !savedSet.has(id)));

    // If nothing changed, return the saved order as-is
    if (additions.length === 0 && valid.length === saved.length) {
      return saved;
    }

    const merged = [...valid, ...additions];
    setSavedOrder(sourceId, filterId, merged);
    return merged;
  }

  // No saved order — shuffle once and save
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

  // Regenerate the order only if the character set actually changed
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

  // Restore index when the filter changes
  useEffect(() => {
    const saved = getSavedIndex(sourceId, filterId);
    setIndex(saved < orderIds.length ? saved : 0);
    alreadyTriggered.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId, filterId]);

  useEffect(() => {
    setSavedIndex(sourceId, filterId, index);
  }, [sourceId, filterId, index]);

  useEffect(() => {
    if (index >= orderIds.length && orderIds.length > 0) {
      setIndex(Math.max(0, orderIds.length - 1));
    }
  }, [orderIds.length, index]);

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
      setIndex((i) => i + 1);
    },
    [current, sourceId]
  );

  const handleSkip = useCallback(() => setIndex((i) => i + 1), []);

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

      {orderIds.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-3xl text-white/30">◌</p>
          <p className="text-sm font-light text-white/50">No characters matched this deck.</p>
          <button
            onClick={onBack}
            className="rounded-full border border-white/15 bg-white/[0.03] px-5 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.07]"
          >
            Pick another deck
          </button>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}