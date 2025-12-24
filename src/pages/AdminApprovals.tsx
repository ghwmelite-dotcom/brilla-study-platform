import { useEffect } from 'react';
import { Shield, AlertCircle, Info } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { PendingUsersPanel } from '@/components/admin';
import { AdminCard, AdminCardHeader } from '@/components/admin';

export default function AdminApprovals() {
  const { loadPendingUsers, pendingCount } = useAuthStore();

  // Load pending users on mount
  useEffect(() => {
    loadPendingUsers();
  }, [loadPendingUsers]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20">
            <Shield className="w-6 h-6 text-admin-accent-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-admin-text">User Approvals</h1>
            <p className="text-admin-text-secondary">Review and manage user registration requests</p>
          </div>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-admin-accent-amber/10 border border-admin-accent-amber/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-admin-accent-amber" />
            <span className="text-admin-accent-amber font-medium">{pendingCount} pending</span>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <AdminCard className="border-admin-accent-cyan/30 bg-admin-accent-cyan/5">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <Info className="w-5 h-5 text-admin-accent-cyan" />
          </div>
          <div>
            <h3 className="font-medium text-admin-text mb-2">Review Process</h3>
            <p className="text-sm text-admin-text-secondary mb-3">
              When users register, their accounts require your approval before they can access the platform.
              Review the registration details carefully before approving or rejecting.
            </p>
            <ul className="text-sm text-admin-text-secondary space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-admin-accent-blue" />
                <span><strong className="text-admin-text">Students:</strong> Verify school level and year group</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-admin-accent-emerald" />
                <span><strong className="text-admin-text">Teachers:</strong> Verify GES license number and qualifications</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-admin-accent-purple" />
                <span><strong className="text-admin-text">Admins:</strong> Verify invitation code is valid</span>
              </li>
            </ul>
          </div>
        </div>
      </AdminCard>

      {/* Pending Users Panel */}
      <AdminCard padding="none">
        <AdminCardHeader
          title="Pending Registrations"
          subtitle="Users awaiting approval"
          icon={<Shield className="w-5 h-5" />}
          className="px-6 pt-6"
        />
        <div className="p-6">
          <PendingUsersPanel />
        </div>
      </AdminCard>

      {/* Help Section */}
      <AdminCard className="bg-admin-bg-tertiary/50">
        <h3 className="font-medium text-admin-text mb-2">Need Help?</h3>
        <p className="text-sm text-admin-text-secondary">
          If you're unsure about a registration, you can reject it with a note asking for more information.
          The user will receive a notification and can re-apply with the requested details.
        </p>
      </AdminCard>
    </div>
  );
}
