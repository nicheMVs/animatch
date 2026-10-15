import { anilistSource } from './anilist';
import { gelbooruSource } from './gelbooru';
import type { SourceDefinition } from './types';

export const SOURCES: Record<string, SourceDefinition> = {
  anilist: anilistSource,
  gelbooru: gelbooruSource,
};

export type SourceId = keyof typeof SOURCES;

export function getSource(id: SourceId): SourceDefinition {
  return SOURCES[id];
}

export type { SourceDefinition };