import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { PendingUsersPanel } from '@/components/admin';

export default function AdminApprovals() {
  const { user, isAuthenticated, loadPendingUsers } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    // Load pending users
    loadPendingUsers();
  }, [isAuthenticated, isAdmin, navigate, loadPendingUsers]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">User Approvals</h1>
              <p className="text-neutral-600">Review and manage user registration requests</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <h3 className="font-medium text-blue-900 mb-1">Review Process</h3>
          <p className="text-sm text-blue-700">
            When users register, their accounts require your approval before they can access the platform.
            Review the registration details carefully before approving or rejecting.
          </p>
          <ul className="mt-2 text-sm text-blue-700 space-y-1">
            <li>&bull; <strong>Students:</strong> Verify school level and year group</li>
            <li>&bull; <strong>Teachers:</strong> Verify GES license number and qualifications</li>
            <li>&bull; <strong>Admins:</strong> Verify invitation code is valid</li>
          </ul>
        </div>

        {/* Pending Users Panel */}
        <PendingUsersPanel />

        {/* Help Section */}
        <div className="mt-8 p-4 bg-neutral-100 rounded-xl">
          <h3 className="font-medium text-neutral-900 mb-2">Need Help?</h3>
          <p className="text-sm text-neutral-600">
            If you're unsure about a registration, you can reject it with a note asking for more information.
            The user will receive a notification and can re-apply with the requested details.
          </p>
        </div>
      </div>
    </div>
  );
}
