export interface Room {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  lastMessage?: string;
  lastMessageSender?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  clientId: string;
  text: string;
  isEncrypted?: boolean;
  createdAt: string;
  // Local decrypted cache
  decryptedText?: string;
}

export interface UserSession {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  clientId: string;
  alias: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
