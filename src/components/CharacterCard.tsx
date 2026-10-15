import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
  type PanInfo,
} from 'framer-motion';
import { Heart } from 'lucide-react';
import { ACTIONS, getActionByDirection, type ActionConfig, type SwipeDirection } from '../config/actions';
import { SETTINGS } from '../config/settings';
import type { Character } from '../types/character';
import PlaceholderImage from './PlaceholderImage';

export interface CharacterCardHandle {
  swipeAction: (actionId: string) => void;
  skip: () => void;
}

interface CharacterCardProps {
  character: Character;
  isTop: boolean;
  onAction: (actionId: string) => void;
  onSkip: () => void;
}

const FLY_DURATION = 0.42;

function exitTarget(dir: SwipeDirection) {
  const w = typeof window !== 'undefined' ? window.innerWidth : 800;
  const h = typeof window !== 'undefined' ? window.innerHeight : 800;
  switch (dir) {
    case 'left':
      return { x: -w * 1.3, y: 60 };
    case 'right':
      return { x: w * 1.3, y: 60 };
    case 'up':
      return { x: 0, y: -h * 1.4 };
    case 'down':
      return { x: 0, y: h * 1.4 };
  }
}

function Stamp({
  action,
  x,
  y,
}: {
  action: ActionConfig;
  x: MotionValue<number>;
  y: MotionValue<number>;
}) {
  const opacity = useTransform([x, y], ([vx, vy]: number[]) => {
    const t = SETTINGS.SWIPE_THRESHOLD_PX;
    const horizontal = Math.abs(vx) > Math.abs(vy);
    switch (action.swipeDirection) {
      case 'right':
        return horizontal && vx > 0 ? Math.min(vx / t, 1) : 0;
      case 'left':
        return horizontal && vx < 0 ? Math.min(-vx / t, 1) : 0;
      case 'up':
        return !horizontal && vy < 0 ? Math.min(-vy / t, 1) : 0;
      case 'down':
        return !horizontal && vy > 0 ? Math.min(vy / t, 1) : 0;
    }
  });

  const scale = useTransform(opacity, [0, 1], [0.85, 1]);

  const position: Record<SwipeDirection, string> = {
    right: 'left-5 top-6 -rotate-12',
    left: 'right-5 top-6 rotate-12',
    up: 'left-1/2 bottom-28 -translate-x-1/2',
    down: 'left-1/2 top-8 -translate-x-1/2',
  };

  const Icon = action.icon;

  return (
    <motion.div
      style={{
        opacity,
        scale,
        borderColor: action.color,
        color: '#fff',
        backgroundColor: `${action.color}dd`,
      }}
      className={`pointer-events-none absolute z-20 flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-2xl font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm ${position[action.swipeDirection]}`}
    >
      <Icon size={22} strokeWidth={2} />
      <span>{action.label}</span>
    </motion.div>
  );
}

const CharacterCard = forwardRef<CharacterCardHandle, CharacterCardProps>(function CharacterCard(
  { character, isTop, onAction, onSkip },
  ref,
) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);
  const scale = useMotionValue(1);
  const busy = useRef(false);
  const [imageFailed, setImageFailed] = useState(false);

  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);

  const dragScaleY = useTransform([x, y], ([vx, vy]: number[]) => {
    const verticalDrag = Math.min(Math.abs(vy) / 300, 1);
    const horizontalDrag = Math.min(Math.abs(vx) / 400, 1);
    return 1 - verticalDrag * 0.04 + horizontalDrag * 0.02;
  });

  const flyOut = (action: ActionConfig) => {
    if (busy.current) return;
    busy.current = true;
    const target = exitTarget(action.swipeDirection);
    const opts = { duration: FLY_DURATION, ease: [0.32, 0.72, 0.35, 1] as const };
    animate(x, target.x, opts);
    animate(y, target.y, opts).then(() => onAction(action.id));
  };

  const skipOut = () => {
    if (busy.current) return;
    busy.current = true;
    animate(scale, 0.7, { duration: 0.25 });
    animate(opacity, 0, { duration: 0.25 }).then(() => onSkip());
  };

  useImperativeHandle(ref, () => ({
    swipeAction: (actionId: string) => {
      const action = ACTIONS.find((a) => a.id === actionId);
      if (action) flyOut(action);
    },
    skip: skipOut,
  }));

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (busy.current) return;
    const { offset, velocity } = info;
    const horizontal = Math.abs(offset.x) > Math.abs(offset.y);
    const dir: SwipeDirection = horizontal
      ? offset.x > 0
        ? 'right'
        : 'left'
      : offset.y > 0
        ? 'down'
        : 'up';
    const distance = horizontal ? Math.abs(offset.x) : Math.abs(offset.y);
    const speed = horizontal ? Math.abs(velocity.x) : Math.abs(velocity.y);
    const action = getActionByDirection(dir);

    const committed =
      action &&
      (distance > SETTINGS.SWIPE_THRESHOLD_PX || (speed > SETTINGS.SWIPE_VELOCITY && distance > 40));

    if (action && committed) {
      flyOut(action);
    } else {
      const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };
      animate(x, 0, spring);
      animate(y, 0, spring);
    }
  };

  const showImage = character.imageUrl && !imageFailed;

  return (
    <motion.div
      className={`absolute inset-0 select-none overflow-hidden rounded-3xl border border-white/[0.08] bg-[#131219] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)] ${
        isTop ? 'no-touch-scroll cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      }`}
      style={{
        x,
        y,
        rotate,
        opacity,
        scale,
        scaleY: dragScaleY,
      }}
      drag={isTop}
      dragElastic={0.9}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
    >
      {showImage ? (
        <img
          src={character.imageUrl!}
          alt={character.name}
          draggable={false}
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <PlaceholderImage name={character.name} />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent px-6 pb-6 pt-24">
        <h2 className="font-display text-3xl leading-tight text-white drop-shadow-md sm:text-4xl">
          {character.name}
        </h2>
        {character.favorites > 0 && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-light tracking-wide text-white/60">
            <Heart size={12} className="fill-rose-400 text-rose-400" strokeWidth={0} />
            {character.favorites.toLocaleString()} fans
          </p>
        )}
      </div>

      {isTop && ACTIONS.map((a) => <Stamp key={a.id} action={a} x={x} y={y} />)}
    </motion.div>
  );
});

export default CharacterCard;