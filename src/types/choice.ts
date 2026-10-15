export interface Choice {
  characterId: number;
  name: string;
  imageUrl: string | null;
  actionId: string;      // stores ACTIONS[n].id, never the label
  timestamp: number;
}
