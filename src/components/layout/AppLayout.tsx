import type { ReactNode } from 'react';

interface AppLayoutProps {
  topBar: ReactNode;
  sidebar: ReactNode;
  mainContent: ReactNode;
}

export function AppLayout({ topBar, sidebar, mainContent }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-base-200">
      {topBar}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 border-r border-base-300/40 bg-base-100 overflow-y-auto">
          {sidebar}
        </aside>
        <main className="flex-1 overflow-hidden">
          {mainContent}
        </main>
      </div>
    </div>
  );
}
