import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import LandingScreen from './components/LandingScreen';
import FilterScreen from './components/FilterScreen';
import GameScreen from './components/GameScreen';
import HistoryScreen from './components/HistoryScreen';
import SkeletonCard from './components/SkeletonCard';
import { getSource } from './sources';
import { getCachedDeck, setCachedDeck } from './services/storage';
import { SETTINGS } from './config/settings';
import type { Character, DeckFilter } from './types/character';

type Screen = 'landing' | 'filter' | 'game' | 'history';
type Status = 'loading' | 'ready' | 'error';

const sourceId = 'anilist' as const;

interface FilterState {
  deck: Character[];
  nextPage: number;
  seen: Set<number>;       // swiped in this filter
  fetched: Set<number>;    // ever fetched in this filter
  status: Status;
  error: string | null;
  exhausted: boolean;
}

const emptyFilterState = (): FilterState => ({
  deck: [],
  nextPage: 1,
  seen: new Set(),
  fetched: new Set(),
  status: 'loading',
  error: null,
  exhausted: false,
});

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [historyReturn, setHistoryReturn] = useState<Screen>('filter');
  const [filter, setFilter] = useState<DeckFilter>('waifus');

  const [waifus, setWaifus] = useState<FilterState>(emptyFilterState);
  const [husbandos, setHusbandos] = useState<FilterState>(emptyFilterState);

  const source = getSource(sourceId);

  const getState = (f: DeckFilter) => (f === 'waifus' ? waifus : husbandos);
  const setState = (f: DeckFilter, updater: (s: FilterState) => FilterState) => {
    if (f === 'waifus') setWaifus(updater);
    else setHusbandos(updater);
  };

  const fetching = useRef<Record<DeckFilter, boolean>>({
    waifus: false,
    husbandos: false,
  });

  const loadMore = useCallback(
    async (f: DeckFilter, mode: 'initial' | 'refill') => {
      if (fetching.current[f]) return;
      fetching.current[f] = true;

      const current = getState(f);
      setState(f, (s) => ({ ...s, status: 'loading', error: null }));

      try {
        const exclude = mode === 'initial' ? new Set<number>() : new Set(current.fetched);
        const startPage = mode === 'initial' ? 1 : current.nextPage;

        const result = await source.fetch(
          f,
          exclude,
          startPage,
          undefined,
          SETTINGS.DECK_SIZE,
          mode === 'initial'
        );

        if (result.characters.length === 0) {
          setState(f, (s) => ({ ...s, status: 'ready', exhausted: true }));
          return;
        }

        const newDeck = mode === 'initial' ? result.characters : [...current.deck, ...result.characters];
        const newFetched = new Set([...current.fetched, ...result.characters.map((c) => c.id)]);

        setState(f, (s) => ({
          ...s,
          deck: newDeck,
          nextPage: result.nextPage,
          fetched: newFetched,
          status: 'ready',
          exhausted: false,
        }));

        setCachedDeck(`${sourceId}__${f}`, {
          characters: newDeck,
          nextPage: result.nextPage,
          seenIds: [...newFetched],
          order: newDeck.map((c) => c.id),
        });
      } catch (err) {
        setState(f, (s) => ({
          ...s,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        }));
      } finally {
        fetching.current[f] = false;
      }
    },
    [source]
  );

  const enterMatch = useCallback(
    (f: DeckFilter) => {
      setFilter(f);
      const cached = getCachedDeck(`${sourceId}__${f}`);

      if (cached && cached.characters.length > 0) {
        setState(f, () => ({
          deck: cached.characters,
          nextPage: cached.nextPage,
          seen: new Set(),
          fetched: new Set(cached.seenIds),
          status: 'ready',
          error: null,
          exhausted: false,
        }));
      } else {
        setState(f, () => emptyFilterState());
        void loadMore(f, 'initial');
      }
      setScreen('game');
    },
    [loadMore]
  );

  const openHistory = (from: Screen) => {
    setHistoryReturn(from);
    setScreen('history');
  };

  const renderGame = () => {
    const s = getState(filter);

    if (s.status === 'loading' && s.deck.length === 0) {
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

    if (s.status === 'error') {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-4xl">◌</p>
          <p className="font-display text-2xl text-white">Couldn't load characters</p>
          <p className="max-w-xs text-xs font-light text-white/40">{s.error}</p>
          <button
            onClick={() => loadMore(filter, s.deck.length === 0 ? 'initial' : 'refill')}
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

    const filterLabel = source.filters.find((x) => x.id === filter)?.label ?? '';

    return (
      <GameScreen
        key={filter}
        characters={s.deck}
        filterId={filter}
        filterLabel={filterLabel}
        sourceId={sourceId}
        onBack={() => setScreen('filter')}
        onHistory={() => openHistory('game')}
        seen={s.seen}
        onMarkSeen={(id) => {
          setState(filter, (state) => {
            if (state.seen.has(id)) return state;
            const next = new Set(state.seen);
            next.add(id);
            return { ...state, seen: next };
          });
        }}
        onRefill={() => loadMore(filter, 'refill')}
        exhausted={s.exhausted}
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
          {screen === 'landing' && <LandingScreen onEnter={() => setScreen('filter')} />}
          {screen === 'filter' && (
            <FilterScreen
              sourceName={source.name}
              sourceFilters={source.filters}
              onSelect={(f) => enterMatch(f)}
              onHistory={() => openHistory('filter')}
              onBack={() => setScreen('landing')}
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