import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { AiTutor, AiButton } from '@/components/ai';
import { ChatButton, ChatSidebar } from '@/components/chat';
import { SkipLink } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';
import { useExamPreferencesStore } from '@/stores/examPreferencesStore';
import { useThemeStore } from '@/stores/themeStore';

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const { loadPreferences, loadExamTypes } = useExamPreferencesStore();
  const { setTheme, theme } = useThemeStore();

  // Initialize theme on mount
  useEffect(() => {
    // Re-apply the theme to ensure it's synced
    setTheme(theme);
  }, [setTheme, theme]);

  // Load exam types and user preferences on mount when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Load available exam types
      loadExamTypes();

      // Load user's exam preferences (students and teachers have preferences)
      if (user.role === 'student' || user.role === 'teacher') {
        loadPreferences();
      }
    }
  }, [isAuthenticated, loadExamTypes, loadPreferences, user]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Skip link for keyboard navigation - WCAG 2.4.1 */}
      <SkipLink />

      <Header
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex flex-1">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-auto pb-20 lg:pb-0"
          tabIndex={-1}
        >
          {children || (
            <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
              <Outlet />
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Community Chat - floating button and chat panel */}
      <ChatButton />
      <ChatSidebar />

      {/* AI Tutor - floating button and chat panel */}
      <AiButton />
      <AiTutor />
    </div>
  );
}
