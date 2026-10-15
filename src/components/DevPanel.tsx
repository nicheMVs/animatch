import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  buildTagString,
  clearLocalOverride,
  saveToSourceFile,
  setLocalOverride,
  getSourceSettings,
} from '../services/devSettings';

interface DevPanelProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function DevPanel({ onClose, onSaved }: DevPanelProps) {
  const initial = getSourceSettings('danbooru');
  const [includeTags, setIncludeTags] = useState(initial.includeTags);
  const [excludeTags, setExcludeTags] = useState(initial.excludeTags);
  const [rating, setRating] = useState(initial.rating);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const preview = buildTagString({ includeTags, excludeTags, rating });

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const settings = { includeTags, excludeTags, rating };
      await saveToSourceFile(settings);
      setLocalOverride('danbooru', settings);
      onSaved();
      // Close the panel after a short delay so the user sees the confirmation
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
      setSaving(false);
    }
  };

  const handleReset = () => {
    clearLocalOverride('danbooru');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 px-4 pb-4 backdrop-blur-sm">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#131219] p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-white">Dev Panel</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/50 hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/40">
              Include tags
            </span>
            <textarea
              value={includeTags}
              onChange={(e) => setIncludeTags(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-white/30 focus:outline-none"
              placeholder="solo highres genshin_impact"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/40">
              Exclude tags
            </span>
            <textarea
              value={excludeTags}
              onChange={(e) => setExcludeTags(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-white/30 focus:outline-none"
              placeholder="comic multiple_views"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/40">
              Rating
            </span>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
            >
              <option value="all">All ratings</option>
              <option value="general">Safe</option>
              <option value="questionable">Questionable</option>
              <option value="explicit">Explicit</option>
            </select>
          </label>

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Query preview</p>
            <p className="mt-1 break-all text-xs text-white/70">{preview || '(empty)'}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-rose-500 py-2 text-sm font-medium text-white transition hover:bg-rose-400 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
          >
            Reset
          </button>
        </div>

        {message && <p className="mt-3 text-center text-xs text-white/50">{message}</p>}
      </motion.div>
    </div>
  );
}