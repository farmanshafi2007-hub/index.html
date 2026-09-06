import React from 'react';
import { ShieldCheck, MessageSquare, ExternalLink, LogOut, LogIn, Copy, Check, Lock } from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  user: UserSession | null;
  currentRoomId: string | null;
  isE2EEEnabled: boolean;
  onToggleE2EE: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onChangeRoom: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentRoomId,
  isE2EEEnabled,
  onToggleE2EE,
  onSignIn,
  onSignOut,
  onChangeRoom,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyRoomId = () => {
    if (!currentRoomId) return;
    navigator.clipboard.writeText(currentRoomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenDuplicateTab = () => {
    const url = new URL(window.location.href);
    if (currentRoomId) {
      url.searchParams.set('room', currentRoomId);
    }
    window.open(url.toString(), '_blank');
  };

  return (
    <header className="bg-[#0D0D10]/95 backdrop-blur border-b border-[#22222A] text-[#E0E0E0] sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Room switch */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C5A059] to-[#8C6D32] flex items-center justify-center text-[#0A0A0C] shadow-md shadow-[#C5A059]/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif-luxury italic text-lg font-semibold tracking-wide text-[#F3F1EC] block leading-tight">
                Room Messenger
              </span>
              <span className="text-[11px] text-[#C5A059] flex items-center gap-1.5 font-medium tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
                Firebase Realtime
              </span>
            </div>
          </div>

          {currentRoomId && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#22222A]">
              <button
                type="button"
                onClick={onChangeRoom}
                className="text-xs bg-[#16161B] hover:bg-[#1E1E26] text-[#C4C3CB] hover:text-[#FAF9F5] px-2.5 py-1.5 rounded-lg border border-[#262632] transition tracking-wide"
              >
                Switch Room
              </button>

              <button
                type="button"
                onClick={handleCopyRoomId}
                className="flex items-center gap-1 text-xs bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] px-2.5 py-1.5 rounded-lg border border-[#C5A059]/30 font-mono transition"
                title="Copy Room ID"
              >
                <span>#{currentRoomId}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-[#C5A059]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* E2EE Toggle Badge */}
          {currentRoomId && (
            <button
              type="button"
              onClick={onToggleE2EE}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition tracking-wide ${
                isE2EEEnabled
                  ? 'bg-[#C5A059]/15 border-[#C5A059]/40 text-[#C5A059]'
                  : 'bg-[#16161B] border-[#262632] text-[#8E8D99] hover:text-[#E0E0E0]'
              }`}
              title="Click to toggle client-side End-to-End Encryption"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-medium">
                {isE2EEEnabled ? 'E2EE Encrypted' : 'Standard Delivery'}
              </span>
            </button>
          )}

          {/* Test in 2nd tab helper */}
          {currentRoomId && (
            <button
              type="button"
              onClick={handleOpenDuplicateTab}
              className="flex items-center gap-1.5 text-xs bg-[#181820] hover:bg-[#20202A] text-[#D8B467] hover:text-[#F0EFEA] px-2.5 py-1.5 rounded-lg border border-[#2C2C38] transition"
              title="Open this room in a new browser tab to test two people chatting"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Test 2nd Person</span>
            </button>
          )}

          {/* Auth State */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#22222A]">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-[#E0E0E0] leading-tight">
                  {user.alias || user.displayName}
                </div>
                <div className="text-[10px] text-[#8E8D99] leading-none">
                  {user.email || 'Signed in'}
                </div>
              </div>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border border-[#2B2B36]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#181820] border border-[#2B2B36] flex items-center justify-center text-xs font-bold text-[#C5A059]">
                  {user.alias ? user.alias.slice(0, 2).toUpperCase() : 'ME'}
                </div>
              )}
              <button
                type="button"
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-[#8E8D99] hover:text-[#E57373] hover:bg-[#1A1A22] transition"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#C5A059] hover:bg-[#D6B36D] text-[#0A0A0C] px-3.5 py-1.5 rounded-lg shadow-md shadow-[#C5A059]/20 transition tracking-wide"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
