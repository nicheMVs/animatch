import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, Sparkles } from 'lucide-react';
import LandingScreen from './components/LandingScreen';
import FilterScreen from './components/FilterScreen';
import GameScreen from './components/GameScreen';
import HistoryScreen from './components/HistoryScreen';
import SkeletonCard from './components/SkeletonCard';
import { getSource, type SourceId } from './sources';
import {
  getCachedDeck,
  getSeenIds,
  setCachedDeck,
  setSeenIds as persistSeenIds,
} from './services/storage';
import { SETTINGS } from './config/settings';
import type { Character, DeckFilter } from './types/character';

type Screen = 'landing' | 'filter' | 'game' | 'history';
type DeckStatus = 'loading' | 'ready' | 'error';
type LoadingMode = 'initial' | 'refill';

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [historyReturn, setHistoryReturn] = useState<Screen>('filter');
  const sourceId: SourceId = 'anilist';
  const [filter, setFilter] = useState<DeckFilter>('both');

  const [deck, setDeck] = useState<Character[]>([]);
  const [nextPage, setNextPage] = useState(1);
  const [displayedIds, setDisplayedIdsState] = useState<Set<number>>(() => getSeenIds(sourceId));
  const [fetchedIds, setFetchedIds] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<DeckStatus>('loading');
  const [loadingMode, setLoadingMode] = useState<LoadingMode>('initial');
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const fetching = useRef(false);
  const emptyRefills = useRef(0);

  const source = getSource(sourceId);

  const setDisplayedIds = useCallback(
    (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => {
      setDisplayedIdsState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        persistSeenIds(sourceId, next);
        return next;
      });
    },
    [sourceId]
  );

  const loadMore = useCallback(
    async (mode: LoadingMode) => {
      if (fetching.current) return;
      fetching.current = true;
      setLoadingMode(mode);
      setStatus('loading');
      setError(null);
      setProgress({ loaded: 0, total: 0 });

      try {
        const exclude = mode === 'initial' ? new Set<number>() : new Set(fetchedIds);
        const startPage = mode === 'initial' ? 1 : emptyRefills.current > 0 ? 0 : nextPage;

        const result = await source.fetch(
          exclude,
          startPage,
          (loaded, total) => setProgress({ loaded, total }),
          SETTINGS.DECK_SIZE,
          mode === 'initial' || emptyRefills.current > 0
        );

        if (result.characters.length === 0) {
          emptyRefills.current += 1;
          if (emptyRefills.current >= 2) {
            setExhausted(true);
            setStatus('ready');
          } else {
            fetching.current = false;
            void loadMore('refill');
          }
          return;
        }

        emptyRefills.current = 0;

        const newDeck = mode === 'initial' ? result.characters : [...deck, ...result.characters];
        const newFetched = new Set([...fetchedIds, ...result.characters.map((c) => c.id)]);

        setDeck(newDeck);
        setFetchedIds(newFetched);
        setNextPage(result.nextPage);
        setCachedDeck(sourceId, {
          characters: newDeck,
          nextPage: result.nextPage,
          seenIds: [...newFetched],
          order: newDeck.map((c) => c.id),
        });
        setStatus('ready');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      } finally {
        fetching.current = false;
      }
    },
    [deck, nextPage, fetchedIds, source, sourceId]
  );

  const enterMatch = useCallback(() => {
    setFilter('both');
    setExhausted(false);
    setError(null);
    emptyRefills.current = 0;

    const cached = getCachedDeck(sourceId);
    if (cached && cached.characters.length > 0) {
      setDeck(cached.characters);
      setNextPage(cached.nextPage);
      setFetchedIds(new Set(cached.seenIds));
      setStatus('ready');
    } else {
      setDeck([]);
      setNextPage(1);
      setFetchedIds(new Set());
      void loadMore('initial');
    }
    setScreen('filter');
  }, [loadMore, sourceId]);

  const filteredDeck = useMemo(() => source.filter(deck, filter), [source, deck, filter]);

  /** Characters not yet displayed. What the game screen pulls from. */
  const availableDeck = useMemo(
    () => filteredDeck.filter((c) => !displayedIds.has(c.id)),
    [filteredDeck, displayedIds]
  );

  const openHistory = (from: Screen) => {
    setHistoryReturn(from);
    setScreen('history');
  };

  const handleMarkDisplayed = useCallback(
    (characterId: number) => {
      setDisplayedIds((prev) => {
        if (prev.has(characterId)) return prev;
        const next = new Set(prev);
        next.add(characterId);
        return next;
      });
    },
    [setDisplayedIds]
  );

  // Refill when the available deck runs empty
  useEffect(() => {
    if (
      status === 'ready' &&
      !exhausted &&
      !fetching.current &&
      availableDeck.length === 0 &&
      deck.length > 0
    ) {
      void loadMore('refill');
    }
  }, [status, exhausted, availableDeck.length, deck.length, loadMore]);

  const renderGame = () => {
    if (status === 'loading') {
      if (loadingMode === 'refill') {
        return (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={40} className="text-rose-300" strokeWidth={1.2} />
            </motion.div>
            <p className="font-display text-2xl text-white">Finding more…</p>
            <p className="text-xs font-light uppercase tracking-[0.2em] text-white/40">
              Refilling your deck
            </p>
            {progress.total > 0 && (
              <div className="mt-2 h-[3px] w-48 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-rose-300/80 transition-all duration-300"
                  style={{ width: `${(progress.loaded / progress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        );
      }
      return (
        <div className="flex h-full flex-col px-4 pb-4 pt-3">
          <header className="flex items-center justify-center">
            <div>
              <h1 className="font-display text-2xl leading-none tracking-tight text-white">
                AniMatch
              </h1>
              <p className="mt-1 text-center text-[10px] font-light uppercase tracking-[0.25em] text-white/40">
                Loading
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
    if (status === 'error') {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-4xl">◌</p>
          <p className="font-display text-2xl text-white">Couldn't load characters</p>
          <p className="max-w-xs text-xs font-light text-white/40">{error}</p>
          <button
            onClick={() => {
              emptyRefills.current = 0;
              loadMore(deck.length === 0 ? 'initial' : 'refill');
            }}
            className="mt-2 flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-5 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.07]"
          >
            <RefreshCw size={14} /> Try again
          </button>
          <button
            onClick={() => setScreen('filter')}
            className="text-xs font-light uppercase tracking-[0.2em] text-white/40 transition hover:text-white/70"
          >
            Back
          </button>
        </div>
      );
    }
    const filterLabel = source.filters.find((f) => f.id === filter)?.label ?? 'Everyone';
    return (
      <GameScreen
        characters={availableDeck}
        filterLabel={filterLabel}
        filterId={filter}
        sourceId={sourceId}
        onBack={() => setScreen('filter')}
        onHistory={() => openHistory('game')}
        onMarkDisplayed={handleMarkDisplayed}
        exhausted={exhausted}
      />
    );
  };

  return (
    <div className="mx-auto h-[100dvh] w-full max-w-[500px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          className="h-full"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {screen === 'landing' && <LandingScreen onEnter={enterMatch} />}
          {screen === 'filter' && (
            <FilterScreen
              sourceName={source.name}
              sourceFilters={source.filters}
              onSelect={(f) => {
                setFilter(f);
                setScreen('game');
              }}
              onHistory={() => openHistory('filter')}
              onBack={() => setScreen('landing')}
              loadingHint={
                status === 'loading' && progress.total > 0
                  ? `Fetching characters… ${progress.loaded}/${progress.total}`
                  : null
              }
            />
          )}
          {screen === 'game' && renderGame()}
          {screen === 'history' && (
            <HistoryScreen sourceId={sourceId} onBack={() => setScreen(historyReturn)} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}