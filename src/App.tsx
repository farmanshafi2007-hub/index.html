import React, { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider, testConnection, handleFirestoreError } from './lib/firebase';
import { encryptText, decryptText } from './lib/crypto';
import { Room, ChatMessage, UserSession, OperationType } from './types';
import { Navbar } from './components/Navbar';
import { RoomSelector } from './components/RoomSelector';
import { ChatView } from './components/ChatView';

// Unique client identifier per browser tab
function getOrCreateClientId(): string {
  let id = sessionStorage.getItem('app_client_id');
  if (!id) {
    id = `tab-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('app_client_id', id);
  }
  return id;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isE2EEEnabled, setIsE2EEEnabled] = useState(true);
  const [passphrase, setPassphrase] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // 1. Initial connection check mandated by Firebase Skill
  useEffect(() => {
    testConnection();
  }, []);

  // 2. Track authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const clientId = getOrCreateClientId();
        const savedAlias = sessionStorage.getItem('chat_alias') || fbUser.displayName || 'Participant';
        setCurrentUser({
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Anonymous',
          email: fbUser.email,
          photoURL: fbUser.photoURL,
          clientId,
          alias: savedAlias,
        });
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. Detect room param in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get('room');
    if (urlRoomId && currentUser && !currentRoom) {
      handleJoinRoom(urlRoomId, `Room #${urlRoomId}`);
    }
  }, [currentUser]);

  // 4. Real-time message listener for current room
  useEffect(() => {
    if (!currentRoom || !currentUser) {
      setMessages([]);
      return;
    }

    const messagesPath = `rooms/${currentRoom.id}/messages`;
    const messagesCol = collection(db, 'rooms', currentRoom.id, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const fetchedMessages: ChatMessage[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const rawText = data.text || '';
          const isEncrypted = !!data.isEncrypted;

          let decrypted = rawText;
          if (isEncrypted) {
            decrypted = await decryptText(rawText, currentRoom.id, passphrase);
          }

          fetchedMessages.push({
            id: docSnap.id,
            roomId: currentRoom.id,
            senderId: data.senderId,
            senderName: data.senderName,
            clientId: data.clientId || '',
            text: rawText,
            isEncrypted,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            decryptedText: decrypted,
          });
        }

        setMessages(fetchedMessages);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, messagesPath);
      }
    );

    return () => unsubscribe();
  }, [currentRoom?.id, currentUser?.uid, passphrase]);

  // Sign in with Google
  const handleSignIn = async () => {
    try {
      setErrorBanner(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign-in error:', err);
      setErrorBanner('Could not sign in with Google. If popups are blocked, please allow popups for this app.');
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentRoom(null);
      setMessages([]);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Join or Create Room
  const handleJoinRoom = async (
    roomId: string,
    roomName: string,
    secretPassphrase: string = '',
    customAlias?: string
  ) => {
    if (!currentUser) {
      await handleSignIn();
      return;
    }

    try {
      setErrorBanner(null);

      // Save custom alias if provided
      if (customAlias?.trim()) {
        sessionStorage.setItem('chat_alias', customAlias.trim());
        setCurrentUser((prev) => (prev ? { ...prev, alias: customAlias.trim() } : null));
      }

      setPassphrase(secretPassphrase);
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);

      let roomData: Room;

      if (roomSnap.exists()) {
        const data = roomSnap.data();
        roomData = {
          id: roomId,
          name: data.name || roomName,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          lastMessage: data.lastMessage,
          lastMessageSender: data.lastMessageSender,
        };
      } else {
        // Create new room document
        roomData = {
          id: roomId,
          name: roomName,
          createdBy: currentUser.uid,
          createdAt: new Date().toISOString(),
        };

        const createPayload = {
          id: roomId,
          name: roomName,
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
        };

        await setDoc(roomRef, createPayload);
      }

      setCurrentRoom(roomData);

      // Update URL query string without reloading
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      window.history.pushState({}, '', url.toString());
    } catch (err) {
      console.error('Error connecting to room:', err);
      setErrorBanner('Failed to connect to room. Check your connection or permissions.');
    }
  };

  // Send Message
  const handleSendMessage = async (rawText: string) => {
    if (!currentRoom || !currentUser || isSending) return;

    setIsSending(true);
    try {
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      let textToSend = rawText;

      if (isE2EEEnabled) {
        textToSend = await encryptText(rawText, currentRoom.id, passphrase);
      }

      const senderDisplayName = currentUser.alias || currentUser.displayName || 'User';

      const messagePayload = {
        id: messageId,
        roomId: currentRoom.id,
        senderId: currentUser.uid,
        senderName: senderDisplayName,
        clientId: currentUser.clientId,
        text: textToSend,
        isEncrypted: isE2EEEnabled,
        createdAt: serverTimestamp(),
      };

      // Add message to subcollection
      const msgRef = doc(db, 'rooms', currentRoom.id, 'messages', messageId);
      await setDoc(msgRef, messagePayload);

      // Update room's last message
      const roomRef = doc(db, 'rooms', currentRoom.id);
      await updateDoc(roomRef, {
        lastMessage: isE2EEEnabled ? '[Encrypted Message]' : rawText.slice(0, 100),
        lastMessageSender: senderDisplayName,
      }).catch(() => {
        // Non-fatal if room update encounters race condition
      });
    } catch (err) {
      console.error('Error sending message:', err);
      handleFirestoreError(err, OperationType.CREATE, `rooms/${currentRoom.id}/messages`);
    } finally {
      setIsSending(false);
    }
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setMessages([]);
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#E0E0E0] flex flex-col font-sans selection:bg-[#C5A059]/30 selection:text-[#FAF9F5]">
      <Navbar
        user={currentUser}
        currentRoomId={currentRoom?.id || null}
        isE2EEEnabled={isE2EEEnabled}
        onToggleE2EE={() => setIsE2EEEnabled(!isE2EEEnabled)}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onChangeRoom={handleLeaveRoom}
      />

      {/* Global Error Banner */}
      {errorBanner && (
        <div className="bg-[#1A0E11] border-b border-[#3E1C22] text-[#F3B3BA] px-4 py-2.5 text-xs text-center flex items-center justify-center gap-2">
          <span>{errorBanner}</span>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="underline font-semibold ml-2 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {authLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[#8E8D99] tracking-wider uppercase">Connecting to Firebase...</span>
            </div>
          </div>
        ) : !currentRoom ? (
          <RoomSelector
            user={currentUser}
            onJoinRoom={handleJoinRoom}
            onSignIn={handleSignIn}
            isLoading={authLoading}
          />
        ) : (
          <ChatView
            user={currentUser!}
            room={currentRoom}
            messages={messages}
            isE2EEEnabled={isE2EEEnabled}
            passphrase={passphrase}
            onSendMessage={handleSendMessage}
            onLeaveRoom={handleLeaveRoom}
            isSending={isSending}
          />
        )}
      </main>
    </div>
  );
}
