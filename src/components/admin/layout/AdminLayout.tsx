import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

export function AdminLayout() {
  const { user, isAuthenticated } = useAuthStore();

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="admin-layout flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <AdminHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto admin-scrollbar p-6 bg-admin-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
