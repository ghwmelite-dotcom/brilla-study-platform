import { useEffect, useState } from 'react';
import { useHouseStore, useAuthStore } from '@/stores';
import { HouseCard, HouseLeaderboard, HousePointsLog } from '@/components/house';

export function HouseCupPage() {
  const { user } = useAuthStore();
  const {
    houses,
    standings,
    recentActivity,
    isLoading,
    fetchHouses,
    fetchStandings,
    fetchActivity,
    createHouse,
  } = useHouseStore();

  const [period, setPeriod] = useState('all_time');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHouseName, setNewHouseName] = useState('');
  const [newHouseColor, setNewHouseColor] = useState('#6366F1');
  const [newHouseDescription, setNewHouseDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchHouses();
    fetchStandings(period);
    fetchActivity(10);
  }, [fetchHouses, fetchStandings, fetchActivity, period]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    fetchStandings(newPeriod);
  };

  const handleCreateHouse = async () => {
    if (!user || user.role !== 'admin' || !newHouseName.trim()) return;

    setIsCreating(true);
    try {
      await createHouse(user.id, {
        name: newHouseName.trim(),
        color: newHouseColor,
        description: newHouseDescription.trim() || undefined,
      });
      setShowCreateModal(false);
      setNewHouseName('');
      setNewHouseColor('#6366F1');
      setNewHouseDescription('');
      fetchHouses();
    } catch (error) {
      console.error('Failed to create house:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const userHouse = houses.find((h) => h.id === user?.house || h.name === user?.house);
  const isAdmin = user?.role === 'admin';

  const presetColors = [
    '#3B82F6', '#EF4444', '#22C55E', '#EAB308',
    '#8B5CF6', '#EC4899', '#F97316', '#14B8A6',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">House Cup</h1>
          <p className="text-neutral-500">Compete for glory and earn points for your house</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            + Create House
          </button>
        )}
      </div>

      {/* User's house banner */}
      {userHouse && (
        <div
          className="p-6 rounded-xl text-white"
          style={{ backgroundColor: userHouse.color }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </div>
            <div>
              <p className="text-white/80 text-sm">Your House</p>
              <h2 className="text-2xl font-bold">{userHouse.name}</h2>
              <p className="text-white/90">
                {userHouse.totalPoints?.toLocaleString() || 0} points | {userHouse.memberCount || 0} members
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard - takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <HouseLeaderboard
            standings={standings}
            period={period}
            onPeriodChange={handlePeriodChange}
          />
        </div>

        {/* Activity log */}
        <div>
          <HousePointsLog activities={recentActivity} limit={8} />
        </div>
      </div>

      {/* All Houses Grid */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">All Houses</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-neutral-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {houses.map((house) => {
              const standing = standings.find((s) => s.houseId === house.id);
              return (
                <HouseCard
                  key={house.id}
                  house={house}
                  rank={standing?.rank}
                  isUserHouse={house.id === userHouse?.id}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Create House Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Create New House</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  House Name
                </label>
                <input
                  type="text"
                  value={newHouseName}
                  onChange={(e) => setNewHouseName(e.target.value)}
                  placeholder="e.g., Phoenix House"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  House Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewHouseColor(color)}
                      className={`
                        w-8 h-8 rounded-full transition-transform
                        ${newHouseColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}
                      `}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={newHouseColor}
                    onChange={(e) => setNewHouseColor(e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newHouseDescription}
                  onChange={(e) => setNewHouseDescription(e.target.value)}
                  placeholder="Enter house description..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Preview */}
              <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-500 mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: newHouseColor }}
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">
                      {newHouseName || 'House Name'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {newHouseDescription || 'No description'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHouse}
                disabled={!newHouseName.trim() || isCreating}
                className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create House'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
