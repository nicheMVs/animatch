import { motion } from 'framer-motion';
import { ACTIONS } from '../config/actions';

interface ActionFilterTabsProps {
  activeId: string; // 'all' or an action id
  counts: Record<string, number>;
  totalCount: number;
  onChange: (id: string) => void;
}

export default function ActionFilterTabs({
  activeId,
  counts,
  totalCount,
  onChange,
}: ActionFilterTabsProps) {
  const tabs = [
    { id: 'all', label: 'All', color: '#ffffff', count: totalCount },
    ...ACTIONS.map((a) => ({
      id: a.id,
      label: a.label,
      color: a.color,
      count: counts[a.id] ?? 0,
      Icon: a.icon,
    })),
  ];

  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;
        const Icon = 'Icon' in tab ? tab.Icon : null;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors"
            style={{
              color: isActive ? tab.color : 'rgba(255,255,255,0.5)',
              borderColor: isActive ? `${tab.color}55` : 'rgba(255,255,255,0.08)',
              backgroundColor: isActive ? `${tab.color}14` : 'rgba(255,255,255,0.02)',
            }}
          >
            {isActive && (
              <motion.span
                layoutId="history-tab-pill"
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: `${tab.color}10`,
                  border: `1px solid ${tab.color}33`,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {Icon && <Icon size={11} strokeWidth={2} />}
              {tab.label}
              <span className="opacity-60">{tab.count}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}