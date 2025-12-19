import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { AiTutor, AiButton } from '@/components/ai';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex flex-1">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
            <Outlet />
          </div>
        </main>
      </div>

      <Footer />

      {/* AI Tutor - floating button and chat panel */}
      <AiButton />
      <AiTutor />
    </div>
  );
}
