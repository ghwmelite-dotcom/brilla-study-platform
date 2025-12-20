import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { AiTutor, AiButton } from '@/components/ai';
import { ChatButton, ChatSidebar } from '@/components/chat';

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
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
          {children || (
            <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
              <Outlet />
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* Community Chat - floating button and chat panel */}
      <ChatButton />
      <ChatSidebar />

      {/* AI Tutor - floating button and chat panel */}
      <AiButton />
      <AiTutor />
    </div>
  );
}
