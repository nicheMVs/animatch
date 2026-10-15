// ─────────────────────────────────────────────────────────────
//  THE ONLY PLACE ACTION NAMES LIVE.
//  Rename, recolor, reorder, or add a 4th action right here.
//  History stores `id`, so renaming a label keeps old history intact.
//  Available swipe directions: 'left' | 'right' | 'up' | 'down'
//  (use each direction at most once).
// ─────────────────────────────────────────────────────────────

import type { LucideIcon } from 'lucide-react';
import { Heart, Gem, Sword } from 'lucide-react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface ActionConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  swipeDirection: SwipeDirection;
}

export const ACTIONS: ActionConfig[] = [
  {
    id: 'action1',
    label: 'Kiss',
    icon: Heart,
    color: '#ff5a7a',
    swipeDirection: 'right',
  },
  {
    id: 'action2',
    label: 'Marry',
    icon: Gem,
    color: '#c9b6ff',
    swipeDirection: 'up',
  },
  {
    id: 'action3',
    label: 'Kill',
    icon: Sword,
    color: '#9aa1ad',
    swipeDirection: 'left',
  },
];

// Helpers
export const getActionById = (id: string): ActionConfig | undefined =>
  ACTIONS.find((a) => a.id === id);

export const getActionByDirection = (dir: SwipeDirection): ActionConfig | undefined =>
  ACTIONS.find((a) => a.swipeDirection === dir);

// Buttons are shown in the order defined above: Kiss, Marry, Kill (left → right).
export const ACTIONS_IN_BUTTON_ORDER: ActionConfig[] = [...ACTIONS];