import { SOURCE_DEFAULTS, type SourceDefaults } from '../config/sourceDefaults';

const OVERRIDE_KEY = 'animatch_dev_override';

export interface DevOverride extends SourceDefaults {}

/**
 * Returns the active settings for a source.
 * - In dev mode, if there's a localStorage override, use it.
 * - Otherwise use the shipped defaults from sourceDefaults.ts.
 */
export function getSourceSettings(sourceId: string): SourceDefaults {
  const defaults = SOURCE_DEFAULTS[sourceId] ?? {
    includeTags: 'solo',
    excludeTags: '',
    rating: 'explicit',
  };

  if (!import.meta.env.DEV) return defaults;

  try {
    const raw = localStorage.getItem(`${OVERRIDE_KEY}_${sourceId}`);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.includeTags === 'string' &&
      typeof parsed?.excludeTags === 'string' &&
      typeof parsed?.rating === 'string'
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }

  return defaults;
}

/** Dev-only: store an override in localStorage so the app uses it without a rebuild. */
export function setLocalOverride(sourceId: string, settings: DevOverride): void {
  try {
    localStorage.setItem(`${OVERRIDE_KEY}_${sourceId}`, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

/** Dev-only: remove the local override and fall back to the shipped defaults. */
export function clearLocalOverride(sourceId: string): void {
  try {
    localStorage.removeItem(`${OVERRIDE_KEY}_${sourceId}`);
  } catch {
    /* ignore */
  }
}

/** Dev-only: writes the settings to sourceDefaults.ts via the dev server endpoint. */
export async function saveToSourceFile(settings: DevOverride): Promise<void> {
  const response = await fetch('/__dev/save-source-defaults', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Save failed (${response.status})`);
  }
}

/** Builds the Danbooru query string from settings. */
export function buildTagString(settings: SourceDefaults): string {
  const parts: string[] = [];
  parts.push(settings.includeTags.trim());
  if (settings.rating && settings.rating !== 'all') {
    parts.push(`rating:${settings.rating}`);
  }
  const exclude = settings.excludeTags.trim();
  if (exclude) {
    // Prefix each exclude tag with a minus
    const excludes = exclude.split(/\s+/).filter(Boolean);
    parts.push(...excludes.map((t) => (t.startsWith('-') ? t : `-${t}`)));
  }
  return parts.filter(Boolean).join(' ');
}