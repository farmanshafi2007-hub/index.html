# Security Specification: Real-Time Room Messenger

## 1. Data Invariants

- **Rooms**:
  - A room must have a valid alphanumeric ID (`id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
  - A room `createdBy` must equal `request.auth.uid`.
  - A room must have a `name` (`string`, `1 <= size <= 100`).
  - A room's `createdAt` must match `request.time`.
  - Immutable fields: `id`, `createdBy`, `createdAt` cannot be changed on update.
  - Updates only permitted on `lastMessage` and `lastMessageSender` when new messages arrive.

- **Messages**:
  - Every message belongs to a valid room `/rooms/{roomId}/messages/{messageId}`.
  - The parent room must exist in `/rooms/{roomId}`.
  - A message's `roomId` in the document body must match the path variable `roomId`.
  - A message's `senderId` must match `request.auth.uid`.
  - A message `createdAt` must strictly equal `request.time`.
  - Messages are append-only; update is blocked to maintain immutable chat audit trails.
  - Senders can delete only their own messages.

## 2. The Dirty Dozen Payloads

1. **Spoofed Room Creator**: User A creates room with `createdBy: "victim_uid"`. -> REJECTED (Sender UID mismatch).
2. **Client Timestamp Tampering**: Client provides artificial `createdAt: 12345678` instead of `request.time`. -> REJECTED.
3. **Room ID Path Injection**: Room ID contains directory traversal or special chars `../../secrets`. -> REJECTED by `isValidId`.
4. **Denial-of-Wallet Text Payload**: Message with 500KB text. -> REJECTED by `text.size() <= 4000`.
5. **Orphaned Message Write**: Writing a message to a non-existent room ID. -> REJECTED by `exists(/databases/$(database)/documents/rooms/$(roomId))`.
6. **Room ID Hijack / Mutation**: Updating a room and mutating the `createdBy` or `id` field. -> REJECTED.
7. **Message Sender Impersonation**: User A writes a message with `senderId: "another_user"`. -> REJECTED.
8. **Malicious Message Update**: User attempts to edit another user's message after sending. -> REJECTED (update disabled).
9. **Message Deletion by Non-Sender**: User B attempts to delete User A's message. -> REJECTED (`resource.data.senderId == request.auth.uid`).
10. **Ghost Fields Injection**: Adding undeclared fields like `isAdmin: true` into Room or Message. -> REJECTED by exact key count and key verification.
11. **Unauthenticated Read / Write**: Reading or writing without valid `request.auth`. -> REJECTED.
12. **Malformed Types**: Passing a numeric value or object for `text` or `name`. -> REJECTED by schema type checks.
