import React, { useState } from 'react';
import { LogIn, Plus, Users, Key, ArrowRight, Sparkles, Hash, ShieldCheck, UserCheck } from 'lucide-react';
import { UserSession } from '../types';

interface RoomSelectorProps {
  user: UserSession | null;
  onJoinRoom: (roomId: string, roomName: string, passphrase?: string, alias?: string) => void;
  onSignIn: () => void;
  isLoading: boolean;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({
  user,
  onJoinRoom,
  onSignIn,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [customAlias, setCustomAlias] = useState(user?.alias || '');

  const quickRooms = [
    { id: 'general', name: 'General Chat' },
    { id: 'dev-lounge', name: 'Developer Lounge' },
    { id: 'private-room-1', name: 'Direct Room #1' },
  ];

  const handleJoinExisting = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = roomIdInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!cleanId) return;
    onJoinRoom(cleanId, `Room #${cleanId}`, passphrase, customAlias);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = (newRoomId.trim() || `room-${Math.floor(1000 + Math.random() * 9000)}`)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
    const cleanName = newRoomName.trim() || `Room ${cleanId}`;
    onJoinRoom(cleanId, cleanName, passphrase, customAlias);
  };

  const handleQuickJoin = (id: string, name: string) => {
    onJoinRoom(id, name, passphrase, customAlias);
  };

  const generateRandomId = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setNewRoomId(`chat-${random}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#0A0A0C] text-[#E0E0E0]">
      <div className="w-full max-w-lg bg-[#111114] border border-[#22222A] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle warm background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-[#8C6D32]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C5A059] to-[#8C6D32] text-[#0A0A0C] mb-3 shadow-lg shadow-[#C5A059]/20">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-semibold text-[#FAF9F5] tracking-wide">
            Connect to a Chat Room
          </h1>
          <p className="text-sm text-[#8E8D99] mt-1">
            Real-time end-to-end messaging with Firebase Firestore database
          </p>
        </div>

        {/* If not signed in */}
        {!user && (
          <div className="mb-6 bg-[#16161B] border border-[#282834] rounded-xl p-4 text-center">
            <p className="text-xs text-[#C4C3CB] mb-3">
              Sign in with your Google account to create or join rooms securely.
            </p>
            <button
              type="button"
              onClick={onSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#C5A059] hover:bg-[#D6B36D] text-[#0A0A0C] font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-[#C5A059]/20 transition active:scale-[0.99] tracking-wide"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in with Google to Continue</span>
            </button>
          </div>
        )}

        {/* Alias / Person identifier (Crucial when testing two tabs with same Google account) */}
        <div className="mb-5 bg-[#141418] border border-[#22222A] rounded-xl p-3.5">
          <label className="block text-xs font-semibold text-[#A1A0AB] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              Your Participant Alias
            </span>
            <span className="text-[10px] text-[#63626F] font-normal">
              Useful for side-by-side tab testing
            </span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              placeholder={user?.displayName || 'e.g. Person 1 or Alice'}
              className="w-full bg-[#0A0A0C] border border-[#24242D] text-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C5A059] transition placeholder:text-[#5A5966]"
            />
            <button
              type="button"
              onClick={() => setCustomAlias('Person 1')}
              className="text-xs px-2.5 py-1.5 bg-[#1C1C22] hover:bg-[#25252D] rounded-lg text-[#C4C3CB] border border-[#2A2A34] transition shrink-0 font-medium"
            >
              P1
            </button>
            <button
              type="button"
              onClick={() => setCustomAlias('Person 2')}
              className="text-xs px-2.5 py-1.5 bg-[#1C1C22] hover:bg-[#25252D] rounded-lg text-[#C4C3CB] border border-[#2A2A34] transition shrink-0 font-medium"
            >
              P2
            </button>
          </div>
        </div>

        {/* Tabs: Join vs Create */}
        <div className="flex border-b border-[#22222A] mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition text-center tracking-wide ${
              activeTab === 'join'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-[#8E8D99] hover:text-[#E0E0E0]'
            }`}
          >
            Join with Room ID
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition text-center tracking-wide ${
              activeTab === 'create'
                ? 'border-[#C5A059] text-[#C5A059]'
                : 'border-transparent text-[#8E8D99] hover:text-[#E0E0E0]'
            }`}
          >
            Create New Room
          </button>
        </div>

        {/* Tab 1: Join Existing Room */}
        {activeTab === 'join' ? (
          <form onSubmit={handleJoinExisting} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A1A0AB] mb-1.5">
                Room ID to Connect
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#63626F]">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  placeholder="e.g. general, alpha-room, 1234"
                  className="w-full bg-[#0A0A0C] border border-[#24242D] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#F0EFEA] placeholder:text-[#5A5966] focus:outline-none focus:border-[#C5A059] transition"
                />
              </div>
            </div>

            {/* Optional Passphrase for E2EE */}
            <div>
              <label className="block text-xs font-semibold text-[#A1A0AB] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#C5A059]" />
                  E2EE Passphrase (Optional)
                </span>
                <span className="text-[10px] text-[#63626F] font-normal">Must match other person</span>
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Leave blank for standard encryption"
                className="w-full bg-[#0A0A0C] border border-[#24242D] rounded-xl px-3 py-2.5 text-sm text-[#F0EFEA] placeholder:text-[#5A5966] focus:outline-none focus:border-[#C5A059] transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !roomIdInput.trim() || !user}
              className="w-full py-3 bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B8934B] hover:from-[#D4AF37] hover:to-[#C5A059] disabled:opacity-40 disabled:pointer-events-none text-[#0A0A0C] font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#C5A059]/20 transition active:scale-[0.99] tracking-wide"
            >
              <span>Connect to Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Tab 2: Create New Room */
          <form onSubmit={handleCreateNew} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A1A0AB] mb-1.5">
                Room Display Name
              </label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. Project Discussion or Secret Chat"
                className="w-full bg-[#0A0A0C] border border-[#24242D] rounded-xl px-3 py-2.5 text-sm text-[#F0EFEA] placeholder:text-[#5A5966] focus:outline-none focus:border-[#C5A059] transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#A1A0AB]">Custom Room ID</label>
                <button
                  type="button"
                  onClick={generateRandomId}
                  className="text-[11px] text-[#C5A059] hover:text-[#D6B36D] flex items-center gap-1 font-medium"
                >
                  <Sparkles className="w-3 h-3" />
                  Random ID
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#63626F]">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  placeholder="e.g. chat-5491"
                  className="w-full bg-[#0A0A0C] border border-[#24242D] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#F0EFEA] placeholder:text-[#5A5966] focus:outline-none focus:border-[#C5A059] transition"
                />
              </div>
            </div>

            {/* Optional Passphrase for E2EE */}
            <div>
              <label className="block text-xs font-semibold text-[#A1A0AB] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#C5A059]" />
                  E2EE Passphrase (Optional)
                </span>
                <span className="text-[10px] text-[#63626F] font-normal">Share this with receiver</span>
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Secret key for end-to-end encryption"
                className="w-full bg-[#0A0A0C] border border-[#24242D] rounded-xl px-3 py-2.5 text-sm text-[#F0EFEA] placeholder:text-[#5A5966] focus:outline-none focus:border-[#C5A059] transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !user}
              className="w-full py-3 bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B8934B] hover:from-[#D4AF37] hover:to-[#C5A059] disabled:opacity-40 disabled:pointer-events-none text-[#0A0A0C] font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#C5A059]/20 transition active:scale-[0.99] tracking-wide"
            >
              <Plus className="w-4 h-4" />
              <span>Create & Enter Room</span>
            </button>
          </form>
        )}

        {/* Quick Join Preset Rooms */}
        <div className="mt-6 pt-5 border-t border-[#22222A]">
          <span className="text-[11px] font-semibold text-[#8E8D99] uppercase tracking-wider block mb-2.5">
            Or Jump into a Preset Room
          </span>
          <div className="grid grid-cols-3 gap-2">
            {quickRooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => handleQuickJoin(room.id, room.name)}
                disabled={!user}
                className="text-left p-2.5 rounded-xl bg-[#141418] hover:bg-[#1A1A20] border border-[#22222A] hover:border-[#C5A059]/40 transition disabled:opacity-40"
              >
                <div className="text-xs font-semibold text-[#FAF9F5] truncate font-mono">#{room.id}</div>
                <div className="text-[10px] text-[#8E8D99] truncate mt-0.5">{room.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Feature badge footer */}
        <div className="mt-6 pt-4 border-t border-[#22222A] flex items-center justify-between text-[11px] text-[#8E8D99]">
          <div className="flex items-center gap-1.5 text-[#C5A059]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>End-to-End Delivery</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Server: Firestore Asia/Global</span>
          </div>
        </div>
      </div>
    </div>
  );
};
