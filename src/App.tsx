import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import LandingScreen from './components/LandingScreen';
import FilterScreen from './components/FilterScreen';
import GameScreen from './components/GameScreen';
import HistoryScreen from './components/HistoryScreen';
import { fetchCharacters, filterDeck } from './services/jikan';
import { getCachedDeck, setCachedDeck } from './services/storage';
import type { Character, DeckFilter } from './types/character';

type Screen = 'landing' | 'filter' | 'game' | 'history';
type DeckStatus = 'loading' | 'ready' | 'error';
type LoadingMode = 'initial' | 'refill';

const FILTER_LABELS: Record<DeckFilter, string> = {
  waifus: 'Waifus',
  husbandos: 'Husbandos',
  both: 'Everyone',
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [historyReturn, setHistoryReturn] = useState<Screen>('filter');
  const [filter, setFilter] = useState<DeckFilter>('both');

  const [deck, setDeck] = useState<Character[]>([]);
  const [nextPage, setNextPage] = useState(1);
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<DeckStatus>('loading');
  const [loadingMode, setLoadingMode] = useState<LoadingMode>('initial');
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const fetching = useRef(false);

  const loadMore = useCallback(
    async (mode: LoadingMode) => {
      if (fetching.current) return;
      fetching.current = true;
      setLoadingMode(mode);
      setStatus('loading');
      setError(null);
      setProgress({ loaded: 0, total: 0 });
      try {
        const exclude = mode === 'initial' ? new Set<number>() : new Set(seenIds);
        const startPage = mode === 'initial' ? 1 : nextPage;
        const result = await fetchCharacters(
          exclude,
          startPage,
          (loaded, total) => setProgress({ loaded, total }),
          undefined,
          mode === 'initial'
        );
        if (result.characters.length === 0) {
          setExhausted(true);
          setStatus('ready');
          return;
        }

        const newDeck = mode === 'initial' ? result.characters : [...deck, ...result.characters];
        const newSeen = new Set([...seenIds, ...result.characters.map((c) => c.id)]);

        setDeck(newDeck);
        setSeenIds(newSeen);
        setNextPage(result.nextPage);
        setCachedDeck({
          characters: newDeck,
          nextPage: result.nextPage,
          seenIds: [...newSeen],
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
    [deck, nextPage, seenIds]
  );

  const enterAniMatch = useCallback(() => {
    const cached = getCachedDeck();
    if (cached && cached.characters.length > 0) {
      setDeck(cached.characters);
      setNextPage(cached.nextPage);
      setSeenIds(new Set(cached.seenIds));
      setStatus('ready');
    } else {
      void loadMore('initial');
    }
    setScreen('filter');
  }, [loadMore]);

  const filteredDeck = useMemo(() => filterDeck(deck, filter), [deck, filter]);

  const openHistory = (from: Screen) => {
    setHistoryReturn(from);
    setScreen('history');
  };

  const handleDeckExhausted = useCallback(() => {
    void loadMore('refill');
  }, [loadMore]);

  const renderGame = () => {
    if (status === 'loading') {
      if (loadingMode === 'refill') {
        return (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={44} className="text-rose-300" strokeWidth={1.2} />
            </motion.div>
            <p className="font-display text-2xl text-white">Finding more characters…</p>
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
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <Loader2 size={40} className="animate-spin text-rose-300" strokeWidth={1.5} />
          <p className="text-sm font-light uppercase tracking-[0.2em] text-white/40">
            Loading characters
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
    if (status === 'error') {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-4xl">◌</p>
          <p className="font-display text-2xl text-white">Couldn't load characters</p>
          <p className="max-w-xs text-xs font-light text-white/40">{error}</p>
          <p className="text-xs font-light text-white/30">
            If this keeps happening, raise ANILIST_REQUEST_DELAY_MS in src/config/settings.ts.
          </p>
          <button
            onClick={() => loadMore(deck.length === 0 ? 'initial' : 'refill')}
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
    return (
      <GameScreen
        characters={filteredDeck}
        filterLabel={FILTER_LABELS[filter]}
        onBack={() => setScreen('filter')}
        onHistory={() => openHistory('game')}
        onExhausted={handleDeckExhausted}
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
          {screen === 'landing' && (
            <LandingScreen
              onSelect={(src) => {
                if (src === 'anilist') enterAniMatch();
              }}
            />
          )}
          {screen === 'filter' && (
            <FilterScreen
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
          {screen === 'history' && <HistoryScreen onBack={() => setScreen(historyReturn)} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}