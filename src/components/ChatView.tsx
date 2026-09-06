import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Lock,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Smile,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowLeft,
  User,
} from 'lucide-react';
import { ChatMessage, UserSession, Room } from '../types';

interface ChatViewProps {
  user: UserSession;
  room: Room;
  messages: ChatMessage[];
  isE2EEEnabled: boolean;
  passphrase: string;
  onSendMessage: (text: string) => Promise<void>;
  onLeaveRoom: () => void;
  isSending: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  user,
  room,
  messages,
  isE2EEEnabled,
  passphrase,
  onSendMessage,
  onLeaveRoom,
  isSending,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef(messages.length);

  const quickEmojis = ['👋', '👍', '❤️', '🔥', '😂', '🎉', '🚀', '💯'];

  // Auto-scroll to bottom on new message
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom(prevMessagesCountRef.current === 0 ? 'auto' : 'smooth');

    // Play subtle audio chime if a new message from someone else arrives
    if (messages.length > prevMessagesCountRef.current) {
      const latestMsg = messages[messages.length - 1];
      if (latestMsg && latestMsg.clientId !== user.clientId && soundEnabled) {
        try {
          playNotificationBeep();
        } catch {
          // ignore audio failure
        }
      }
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages, soundEnabled, user.clientId]);

  // Subtle web audio synthesizer beep for message chime
  const playNotificationBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext unavailable
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setInputText('');
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyInvite = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', room.id);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenDuplicateTab = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', room.id);
    window.open(url.toString(), '_blank');
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full bg-[#0A0A0C] sm:border-x border-[#22222A] shadow-2xl overflow-hidden">
      {/* Room Header Banner */}
      <div className="bg-[#0D0D10]/95 backdrop-blur border-b border-[#22222A] px-4 py-3 sm:px-6 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onLeaveRoom}
            className="p-1.5 rounded-lg text-[#8E8D99] hover:text-[#FAF9F5] hover:bg-[#181820] transition"
            title="Leave room / Choose another"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-serif-luxury text-lg font-semibold text-[#FAF9F5] tracking-wide truncate">
                {room.name}
              </h2>
              <span className="bg-[#16161B] text-[#C5A059] text-xs px-2 py-0.5 rounded-md font-mono border border-[#282834]">
                #{room.id}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8E8D99]">
              <span className="flex items-center gap-1 text-[#C5A059]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
                Live on Firestore
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {isE2EEEnabled ? (
                  <span className="text-[#C5A059] flex items-center gap-1 font-medium">
                    <Lock className="w-3 h-3" /> E2EE Active
                  </span>
                ) : (
                  <span className="text-[#8E8D99]">Standard Delivery</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Audio toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition ${
              soundEnabled
                ? 'bg-[#16161B] border-[#2A2A36] text-[#C4C3CB] hover:text-white'
                : 'bg-[#121216] border-[#1E1E24] text-[#5A5966]'
            }`}
            title={soundEnabled ? 'Mute chimes' : 'Unmute chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Copy Room Link */}
          <button
            type="button"
            onClick={handleCopyInvite}
            className="flex items-center gap-1.5 text-xs bg-[#16161B] hover:bg-[#1E1E26] text-[#C4C3CB] hover:text-[#FAF9F5] px-2.5 py-1.5 rounded-lg border border-[#262632] transition"
            title="Copy direct invite link with Room ID"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="hidden sm:inline text-[#C5A059] font-medium">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Invite Link</span>
              </>
            )}
          </button>

          {/* Test 2nd person in duplicate tab */}
          <button
            type="button"
            onClick={handleOpenDuplicateTab}
            className="flex items-center gap-1.5 text-xs bg-[#181820] hover:bg-[#20202A] text-[#C5A059] border border-[#2A2A36] px-2.5 py-1.5 rounded-lg transition font-medium"
            title="Open side-by-side tab with this Room ID to test messaging"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Open 2nd Tab</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-[#0A0A0C] via-[#0D0D11] to-[#0A0A0C]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8E8D99]">
            <div className="w-14 h-14 rounded-2xl bg-[#141419] border border-[#22222A] flex items-center justify-center text-[#C5A059] mb-3 shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="font-serif-luxury text-xl font-semibold text-[#FAF9F5] tracking-wide">
              No messages yet in #{room.id}
            </h3>
            <p className="text-xs text-[#8E8D99] max-w-sm mt-1 mb-4 leading-relaxed">
              Send the first message below, or share this room ID with another person to start talking in real time!
            </p>
            <button
              type="button"
              onClick={handleOpenDuplicateTab}
              className="text-xs font-medium text-[#C5A059] hover:text-[#D6B36D] bg-[#16161B] border border-[#2A2A36] px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Click to open second tab to test messaging yourself</span>
            </button>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.clientId === user.clientId;
            const displayText = msg.decryptedText || msg.text;

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Sender badge */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-[#8E8D99]">
                  <span className="font-medium text-[#C4C3CB]">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  {msg.isEncrypted && (
                    <span
                      className="text-[#C5A059] flex items-center"
                      title="End-to-End Encrypted"
                    >
                      <Lock className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <span>•</span>
                  <span>{formatTime(msg.createdAt)}</span>
                </div>

                {/* Bubble */}
                <div
                  className={`relative max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-md break-words ${
                    isMe
                      ? 'bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B8934B] text-[#0A0A0C] font-medium rounded-tr-none shadow-[#C5A059]/10'
                      : 'bg-[#141419] border border-[#22222A] text-[#EDECE8] rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{displayText}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Quick Picker */}
      {showEmojiPicker && (
        <div className="bg-[#0D0D10] border-t border-[#22222A] px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setInputText((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="text-lg hover:scale-125 transition px-2 py-1 rounded-md hover:bg-[#1A1A22]"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Message Input Form */}
      <div className="bg-[#0D0D10] border-t border-[#22222A] p-3 sm:p-4 shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto">
          {/* Quick emoji toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 text-[#8E8D99] hover:text-[#C5A059] hover:bg-[#16161B] rounded-xl transition shrink-0"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Text Input area */}
          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message in #${room.id}... (Enter to send)`}
              className="w-full bg-[#0A0A0C] border border-[#24242D] text-[#F0EFEA] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C5A059] transition resize-none max-h-32 min-h-[42px] placeholder:text-[#5A5966]"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="h-[42px] px-4 bg-[#C5A059] hover:bg-[#D6B36D] disabled:opacity-40 disabled:pointer-events-none text-[#0A0A0C] font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-[#C5A059]/20 transition active:scale-95 shrink-0 tracking-wide"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Send</span>
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-[#8E8D99] mt-2 px-1">
          <span>Connected as {user.alias || user.displayName}</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#C5A059]" />
            <span>Messages sync in real time across all participants</span>
          </span>
        </div>
      </div>
    </div>
  );
};
