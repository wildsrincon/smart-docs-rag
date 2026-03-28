# SmartDocs RAG Platform Proposal

**Intent**: Implement a RAG platform where users can upload PDF/Docs and chat with them using AI.

**Scope (MVP)**:
- Async document ingestion with BackgroundTasks
- Semantic chunking (500-800 tokens, 20% overlap)
- PostgreSQL + pgvector for embeddings storage
- Real-time chat with WebSockets
- LangChain integration with OpenAI GPT-4o-mini

**Features Future**: Re-ranking, hybrid search, caching, multi-format support, advanced multi-tenancy

**Architecture**:
- Frontend: Next.js 15, React 19, Tailwind CSS 4, Zustand 5
- Backend: FastAPI, PostgreSQL 15 + pgvector, SQLAlchemy 2.0.36
- AI: OpenAI GPT-4o-mini + text-embedding-3-small, LangChain
- Pipeline: Upload → PDF Extraction → Chunking → Embeddings → pgvector → RAG → Streaming

**Affected Modules**:
- Backend: New rag/ module, entities for documents/chunks/conversations/messages, API routes, WebSocket endpoint
- Frontend: Document upload UI, chat interface, WebSocket client

**Success Criteria**:
- 100-page PDF ingestion < 60s without timeout
- Vector search latency < 200ms
- Streaming response latency < 100ms
- 100% pytest passing
- No memory leaks
