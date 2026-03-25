'use client';

type Tab = 'booking' | 'myBookings' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs: { id: Tab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
    {
      id: 'profile',
      label: 'פרופיל',
      icon: (active) => (
        <svg className={`w-6 h-6 ${active ? 'text-primary' : 'text-muted'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'myBookings',
      label: 'התורים שלי',
      icon: (active) => (
        <svg className={`w-6 h-6 ${active ? 'text-primary' : 'text-muted'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'booking',
      label: 'קביעת תור',
      icon: (active) => (
        <svg className={`w-6 h-6 ${active ? 'text-primary' : 'text-muted'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="sticky bottom-0 bg-white border-t border-border safe-area-bottom z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center gap-1 py-2.5 px-4 min-w-[72px] transition-colors
                ${isActive ? 'text-primary' : 'text-muted'}
              `}
            >
              <div className={`
                p-1.5 rounded-xl transition-all
                ${isActive ? 'bg-primary/10' : ''}
              `}>
                {tab.icon(isActive)}
              </div>
              <span className={`text-[11px] font-semibold ${isActive ? 'text-primary' : 'text-muted'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
