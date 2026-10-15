export type DeckFilter = 'waifus' | 'husbandos' | 'both';

export interface Character {
  id: number;
  name: string;
  imageUrl: string | null;
  gender: string | null;
  favorites: number;
}