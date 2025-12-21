import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Search,
  Swords,
  Flame,
  Target,
  Check,
  X,
  Clock,
  Zap,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { useFriendStore } from '@/stores/friendStore';
import { useToastStore } from '@/stores/toastStore';
import { useAuthStore } from '@/stores/authStore';
import type { Friend, FriendChallenge, ChallengeType } from '@/types';
import { cn } from '@/utils';

const CHALLENGE_TYPES: { type: ChallengeType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'quiz_battle', label: 'Quiz Battle', icon: <Swords className="w-5 h-5" />, description: 'Answer questions head-to-head' },
  { type: 'xp_race', label: 'XP Race', icon: <Zap className="w-5 h-5" />, description: 'Race to earn the most XP' },
  { type: 'streak_challenge', label: 'Streak Challenge', icon: <Flame className="w-5 h-5" />, description: 'Maintain streak longer' },
  { type: 'topic_mastery', label: 'Topic Mastery', icon: <Target className="w-5 h-5" />, description: 'Master a topic first' },
];

interface FriendCardProps {
  friend: Friend;
  onChallenge: (friend: Friend) => void;
}

function FriendCard({ friend, onChallenge }: FriendCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border hover:shadow-md transition-shadow">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
          {friend.avatar ? (
            <img src={friend.avatar} alt={friend.odName} className="w-full h-full rounded-full object-cover" />
          ) : (
            friend.odName.charAt(0).toUpperCase()
          )}
        </div>
        {friend.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 truncate">{friend.odName}</h4>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Level {friend.level}</span>
          {friend.house && (
            <>
              <span>•</span>
              <span className="capitalize">{friend.house}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onChallenge(friend)}
          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Challenge"
        >
          <Swords className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

interface ChallengeCardProps {
  challenge: FriendChallenge;
  userId: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

function ChallengeCard({ challenge, userId, onAccept, onDecline }: ChallengeCardProps) {
  const isChallenger = challenge.challengerId === userId;
  const opponentName = isChallenger ? challenge.challengedName : challenge.challengerName;
  const myProgress = isChallenger ? challenge.challengerProgress : challenge.challengedProgress;
  const opponentProgress = isChallenger ? challenge.challengedProgress : challenge.challengerProgress;

  const challengeType = CHALLENGE_TYPES.find((t) => t.type === challenge.challengeType);

  return (
    <div className={cn(
      'p-4 rounded-xl border',
      challenge.status === 'active' && 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200',
      challenge.status === 'pending' && 'bg-amber-50 border-amber-200',
      challenge.status === 'completed' && 'bg-gray-50 border-gray-200'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            {challengeType?.icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{challengeType?.label}</h4>
            <p className="text-xs text-gray-500">vs {opponentName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-amber-600 bg-amber-100 px-2 py-1 rounded-full text-sm">
          <Zap className="w-4 h-4" />
          <span className="font-medium">{challenge.xpWager} XP</span>
        </div>
      </div>

      {challenge.status === 'active' && (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>You: {myProgress}</span>
            <span>{opponentName}: {opponentProgress}</span>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-indigo-500 rounded-full"
              style={{ width: `${Math.min(50, (myProgress / (challenge.targetValue || 100)) * 50)}%` }}
            />
            <div
              className="absolute right-0 top-0 h-full bg-purple-500 rounded-full"
              style={{ width: `${Math.min(50, (opponentProgress / (challenge.targetValue || 100)) * 50)}%` }}
            />
          </div>
        </div>
      )}

      {challenge.status === 'pending' && !isChallenger && (
        <div className="flex gap-2">
          <button
            onClick={() => onAccept(challenge.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Check className="w-4 h-4" />
            Accept
          </button>
          <button
            onClick={() => onDecline(challenge.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
            Decline
          </button>
        </div>
      )}

      {challenge.status === 'pending' && isChallenger && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <Clock className="w-4 h-4" />
          <span>Waiting for response...</span>
        </div>
      )}

      {challenge.status === 'completed' && (
        <div className="flex items-center gap-2">
          <Crown className={cn(
            'w-5 h-5',
            challenge.winnerId === userId ? 'text-amber-500' : 'text-gray-400'
          )} />
          <span className={cn(
            'font-medium',
            challenge.winnerId === userId ? 'text-green-600' : 'text-gray-600'
          )}>
            {challenge.winnerId === userId ? 'You won!' : 'You lost'}
          </span>
        </div>
      )}
    </div>
  );
}

export default function FriendsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    friends,
    pendingRequests,
    challenges,
    activeChallenges,
    isLoading,
    fetchFriends,
    fetchChallenges,
    acceptFriendRequest,
    declineFriendRequest,
    acceptChallenge,
    declineChallenge,
    createChallenge,
    searchUsers,
  } = useFriendStore();
  const toast = useToastStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [, setSearchResults] = useState<Friend[]>([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [tab, setTab] = useState<'friends' | 'challenges' | 'requests'>('friends');

  useEffect(() => {
    fetchFriends();
    fetchChallenges();
  }, [fetchFriends, fetchChallenges]);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
  };

  const handleChallenge = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowChallengeModal(true);
  };

  const handleCreateChallenge = async (type: ChallengeType) => {
    if (!selectedFriend) return;

    const success = await createChallenge(selectedFriend.odUserId, type);
    if (success) {
      toast.showSuccess('Challenge Sent!', `Waiting for ${selectedFriend.odName} to accept`);
      setShowChallengeModal(false);
      setSelectedFriend(null);
    } else {
      toast.showError('Failed', 'Could not send challenge');
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    const success = await acceptChallenge(challengeId);
    if (success) {
      toast.showSuccess('Challenge Accepted!', 'Game on!');
    }
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    await declineChallenge(challengeId);
  };

  const pendingChallenges = challenges.filter(
    (c) => c.status === 'pending' && c.challengedId === user?.id
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Friends & Challenges</h1>
            <p className="text-gray-500">Connect and compete with friends</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for friends by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'friends', label: 'Friends', count: friends.length },
            { id: 'challenges', label: 'Challenges', count: activeChallenges.length },
            { id: 'requests', label: 'Requests', count: pendingRequests.length + pendingChallenges.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
                tab === t.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span className={cn(
                  'px-2 py-0.5 text-xs rounded-full',
                  tab === t.id ? 'bg-white/20' : 'bg-gray-200'
                )}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {tab === 'friends' && (
              <div className="space-y-3">
                {friends.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-1">No friends yet</h3>
                    <p className="text-gray-500 text-sm">Search for friends to add them</p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      onChallenge={handleChallenge}
                    />
                  ))
                )}
              </div>
            )}

            {tab === 'challenges' && (
              <div className="space-y-3">
                {activeChallenges.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border">
                    <Swords className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-1">No active challenges</h3>
                    <p className="text-gray-500 text-sm">Challenge a friend to get started</p>
                  </div>
                ) : (
                  activeChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      userId={user?.id || ''}
                      onAccept={handleAcceptChallenge}
                      onDecline={handleDeclineChallenge}
                    />
                  ))
                )}
              </div>
            )}

            {tab === 'requests' && (
              <div className="space-y-6">
                {pendingChallenges.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Challenge Requests</h3>
                    <div className="space-y-3">
                      {pendingChallenges.map((challenge) => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          userId={user?.id || ''}
                          onAccept={handleAcceptChallenge}
                          onDecline={handleDeclineChallenge}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {pendingRequests.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Friend Requests</h3>
                    <div className="space-y-3">
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {request.odName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{request.odName}</h4>
                            <p className="text-sm text-gray-500">Level {request.level}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => acceptFriendRequest(request.id)}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => declineFriendRequest(request.id)}
                              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingChallenges.length === 0 && pendingRequests.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl border">
                    <Check className="w-12 h-12 text-green-300 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-1">All caught up!</h3>
                    <p className="text-gray-500 text-sm">No pending requests</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Challenge Modal */}
      {showChallengeModal && selectedFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Challenge {selectedFriend.odName}
            </h3>
            <p className="text-gray-500 mb-6">Choose a challenge type</p>

            <div className="space-y-3">
              {CHALLENGE_TYPES.map((type) => (
                <button
                  key={type.type}
                  onClick={() => handleCreateChallenge(type.type)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border hover:bg-indigo-50 hover:border-indigo-200 transition-colors text-left"
                >
                  <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{type.label}</h4>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowChallengeModal(false)}
              className="w-full mt-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
