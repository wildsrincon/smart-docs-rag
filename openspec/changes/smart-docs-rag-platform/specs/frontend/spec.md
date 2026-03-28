# Frontend Specification: SmartDocs RAG Platform

## Purpose

Define the frontend UI/UX requirements for uploading documents and engaging in RAG-powered chat sessions.

## Requirements

### Requirement: Document Upload Interface

The system MUST provide a user interface for uploading PDF files with visual feedback.

#### Scenario: Drag-and-Drop Upload
- GIVEN the user is on the document management page
- WHEN they drag a PDF file onto the upload area
- THEN the system MUST display the file name and size
- AND verify the file extension is `.pdf`
- AND initiate the upload via `POST /api/v1/documents/upload`
- AND show a progress bar indicating upload status

#### Scenario: Upload Progress & Completion
- GIVEN a file upload is in progress
- WHEN the upload completes
- THEN the system MUST poll the document status or listen for a WebSocket update
- AND display "Processing..." while the backend processes chunks
- AND update the status to "Ready" once processing is complete

### Requirement: Chat Interface (RAG)

The system MUST provide a chat interface that connects to the backend WebSocket for real-time conversation.

#### Scenario: Initiating a Chat
- GIVEN a document in "Ready" status
- WHEN the user clicks "Chat" on the document card
- THEN the system MUST navigate to the chat view (`/documents/{id}/chat`)
- AND establish a WebSocket connection to `ws://.../chat/{id}`
- AND display previous chat history if available

#### Scenario: Sending a Message
- GIVEN an active chat session
- WHEN the user types a question and presses Enter
- THEN the system MUST display the user's message immediately
- AND send the message over the WebSocket
- AND show a "Thinking..." indicator or streaming cursor

#### Scenario: Receiving a Streaming Response
- GIVEN the user has sent a message
- WHEN the backend streams response tokens
- THEN the system MUST append the tokens to the assistant's message bubble in real-time
- AND render Markdown content (lists, code blocks) properly
- AND scroll to the bottom automatically as new content arrives

### Requirement: Error Handling

The system MUST gracefully handle connection errors and display user-friendly messages.

#### Scenario: WebSocket Disconnection
- GIVEN an active chat session
- WHEN the WebSocket connection is lost
- THEN the system MUST display a "Reconnecting..." banner
- AND attempt to reconnect automatically with exponential backoff
- OR show "Connection failed. Please refresh." after max retries

## UI Components (Next.js/Tailwind)

### `DocumentUploadZone`
- Interactive drop zone
- File validation logic
- Upload progress bar using `shadcn/ui` Progress

### `ChatWindow`
- Message list container
- Auto-scroll behavior
- Typing indicator

### `MessageBubble`
- Props: `role` (user/assistant), `content` (markdown), `isStreaming`
- Styling: Distinct colors for user vs assistant (e.g., blue vs gray)

### `ChatInput`
- Textarea with auto-resize
- Send button (disabled when empty or streaming)
