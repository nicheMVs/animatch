export type DeckFilter = 'waifus' | 'husbandos';

export interface Character {
  id: number;
  name: string;
  anime: string | null;
  imageUrl: string | null;
  gender: string | null;
}