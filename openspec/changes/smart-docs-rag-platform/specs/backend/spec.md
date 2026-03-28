# Backend Specification: SmartDocs RAG Platform

## Purpose

Define the backend architecture and API requirements for the RAG platform, including document ingestion, vector storage, and real-time chat.

## Requirements

### Requirement: Document Upload & Ingestion

The system MUST allow users to upload PDF documents for processing and vector storage.

#### Scenario: Successful PDF Upload
- GIVEN an authenticated user and a valid PDF file (< 10MB)
- WHEN the user uploads the file via `POST /api/v1/documents/upload`
- THEN the system MUST save the file temporarily
- AND create a `Document` record with status `processing`
- AND trigger a background task for processing
- AND return 202 Accepted with the `document_id`

#### Scenario: Invalid File Type
- GIVEN an authenticated user and a non-PDF file (e.g., .exe)
- WHEN the user attempts to upload the file
- THEN the system MUST reject the request with 400 Bad Request
- AND return an error message "Only PDF files are supported"

### Requirement: Document Processing Pipeline

The system MUST process uploaded documents asynchronously to extract text, chunk it, and generate embeddings.

#### Scenario: Successful Processing
- GIVEN a `Document` in `processing` status
- WHEN the background task runs
- THEN the system MUST extract text from the PDF using `pypdf` or similar
- AND split the text into chunks of 500-800 tokens with 20% overlap
- AND generate embeddings for each chunk using OpenAI `text-embedding-3-small`
- AND store the chunks and embeddings in the `document_chunks` table
- AND update the `Document` status to `completed`

#### Scenario: Processing Failure
- GIVEN a `Document` in `processing` status
- WHEN the background task encounters an error (e.g., corrupted PDF)
- THEN the system MUST update the `Document` status to `failed`
- AND store the error message in the `error_message` field

### Requirement: Vector Storage (pgvector)

The system MUST use PostgreSQL with `pgvector` to store and query document embeddings.

#### Scenario: Vector Search
- GIVEN a user query and a target `document_id`
- WHEN the system performs a similarity search
- THEN it MUST return the top K (e.g., 5) most similar chunks
- AND the search MUST be filtered by `document_id` and `user_id` (for security)
- AND the search SHOULD use an HNSW index for performance

### Requirement: Real-time Chat (WebSocket)

The system MUST provide a WebSocket endpoint for real-time RAG-based chat.

#### Scenario: Chat Session
- GIVEN an authenticated user connected to `ws://.../chat/{document_id}`
- WHEN the user sends a text message
- THEN the system MUST retrieve relevant context chunks
- AND generate a response using OpenAI GPT-4o-mini
- AND stream the response tokens back to the client in real-time
- AND save the message exchange to the database

#### Scenario: Connection Error
- GIVEN a user with an invalid token
- WHEN they attempt to connect to the WebSocket
- THEN the system MUST close the connection with code 4001 (Unauthorized)

## Data Models

### Document
- `id`: UUID (PK)
- `user_id`: UUID (FK)
- `filename`: String
- `status`: Enum (pending, processing, completed, failed)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### DocumentChunk
- `id`: UUID (PK)
- `document_id`: UUID (FK)
- `content`: Text
- `embedding`: Vector(1536)
- `chunk_index`: Integer
- `metadata`: JSONB

### ChatSession
- `id`: UUID (PK)
- `document_id`: UUID (FK)
- `user_id`: UUID (FK)
- `created_at`: Timestamp

### ChatMessage
- `id`: UUID (PK)
- `session_id`: UUID (FK)
- `role`: Enum (user, assistant)
- `content`: Text
- `created_at`: Timestamp
