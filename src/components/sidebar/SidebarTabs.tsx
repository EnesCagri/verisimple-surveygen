import { Tooltip } from '../ui/Tooltip';

export type SidebarTab = 'questions' | 'flow';

interface SidebarTabsProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

const tabs: { id: SidebarTab; label: string; tooltip: string; icon: React.JSX.Element }[] = [
  {
    id: 'questions',
    label: 'Sorular',
    tooltip: 'Soruları listele, ekle ve düzenle',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 17h.01" />
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
        <path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
      </svg>
    ),
  },
  {
    id: 'flow',
    label: 'Akış',
    tooltip: 'Koşullu dallanma akışını görüntüle',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v6" />
        <circle cx="12" cy="12" r="3" />
        <path d="m8 15-3 3h14l-3-3" />
        <path d="M5 21v-3" />
        <path d="M19 21v-3" />
      </svg>
    ),
  },
];

export function SidebarTabs({ activeTab, onTabChange }: SidebarTabsProps) {
  return (
    <div className="flex border-b border-base-300/40">
      {tabs.map((tab) => (
        <Tooltip key={tab.id} content={tab.tooltip} position="bottom" delay={500} className="flex-1">
          <button
            className={`
              w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-semibold uppercase tracking-wide
              transition-all duration-200 border-b-2
              ${activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-base-content/35 hover:text-base-content/60'
              }
            `}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

