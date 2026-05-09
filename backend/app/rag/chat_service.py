"""RAG chat service for query processing and answer generation"""

import ast
import json
import logging
from typing import List, Optional, AsyncIterator
from uuid import UUID
from datetime import datetime, timezone

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.rag.embedding_config import build_embeddings_client
from app.rag.vector_store import VectorStore

logger = logging.getLogger(__name__)


class ChatService:
    """Handles RAG chat: retrieval, context assembly, and LLM generation"""

    def __init__(self):
        self.vector_store = VectorStore()
        self._embeddings = self._build_embeddings()
        self.chat_llm: BaseChatModel = self._build_chat_llm()

    @staticmethod
    def _build_embeddings():
        return build_embeddings_client()

    @staticmethod
    def _build_chat_llm() -> BaseChatModel:
        provider = settings.llm_provider
        if provider == "gemini":
            from langchain_google_genai import ChatGoogleGenerativeAI

            return ChatGoogleGenerativeAI(
                model=settings.GEMINI_CHAT_MODEL,
                google_api_key=settings.GOOGLE_AI_API_KEY,
                temperature=0.7,
                streaming=True,
            )
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=settings.chat_model,
            api_key=settings.chat_api_key,
            base_url=settings.chat_base_url,
            temperature=0.7,
            streaming=True,
        )

    async def generate_query_embedding(self, query: str) -> List[float]:
        """Generate embedding for a user query."""
        try:
            response = await self._embeddings.embeddings.create(
                model=settings.embedding_model,
                input=query,
                extra_body={
                    "input_type": "query",
                    "output_dimension": settings.EMBEDDING_DIMENSION,
                },
            )
            embedding = response.data[0].embedding

            if not isinstance(embedding, list):
                raise ValueError(
                    f"Embedding provider returned unexpected type: {type(embedding)!r}"
                )
            logger.info(f"Query embedding generated: dim={len(embedding)}")
            return embedding
        except Exception as e:
            logger.error(f"Error generating query embedding: {e}")
            raise

    async def retrieve_relevant_chunks(
        self,
        db: AsyncSession,
        user_id: UUID,
        query_embedding: List[float],
        document_ids: Optional[List[UUID]] = None,
        top_k: int = 10,
    ) -> List[dict]:
        """
        Retrieve relevant chunks using vector similarity search.

        Args:
            db: Async database session
            user_id: User UUID for isolation
            query_embedding: Query vector
            document_ids: Optional filter for specific documents
            top_k: Number of results to retrieve

        Returns:
            List of chunk dictionaries with content and metadata
        """
        try:
            chunks = await self.vector_store.similarity_search(
                db,
                user_id,
                query_embedding,
                limit=top_k,
                document_ids=document_ids,
                threshold=settings.SIMILARITY_THRESHOLD,
            )

            # Format chunks for context assembly. Metadata is best-effort: legacy
            # rows may contain Python repr strings (single quotes), but malformed
            # metadata must never break chat retrieval or citation generation.
            formatted_chunks = []
            for chunk in chunks:
                formatted_chunks.append(
                    {
                        "content": chunk.content,
                        "document_id": str(chunk.document_id),
                        "chunk_index": chunk.chunk_index,
                        "metadata": self._parse_chunk_metadata(
                            chunk.chunk_metadata,
                            chunk_id=str(chunk.id),
                            chunk_index=chunk.chunk_index,
                        ),
                    }
                )

            logger.info(f"Retrieved {len(formatted_chunks)} relevant chunks")
            return formatted_chunks

        except Exception as e:
            logger.error(f"Error retrieving chunks: {e}")
            raise

    @staticmethod
    def _parse_chunk_metadata(
        raw_metadata: object,
        *,
        chunk_id: str | None = None,
        chunk_index: int | None = None,
    ) -> dict:
        """Parse chunk metadata without letting invalid rows break chat.

        New rows are stored as JSON strings. Some legacy rows were stored using
        Python dict repr (for example: ``{'filename': 'doc.pdf'}``), so we support
        a safe literal fallback while continuing to degrade malformed values to an
        empty metadata object.
        """

        if raw_metadata is None or raw_metadata == "":
            return {}

        if isinstance(raw_metadata, dict):
            return raw_metadata

        if not isinstance(raw_metadata, str):
            logger.warning(
                "Invalid chunk metadata type for chunk_id=%s chunk_index=%s: %s",
                chunk_id,
                chunk_index,
                type(raw_metadata).__name__,
            )
            return {}

        try:
            parsed = json.loads(raw_metadata)
        except json.JSONDecodeError:
            try:
                parsed = ast.literal_eval(raw_metadata)
            except (ValueError, SyntaxError):
                logger.warning(
                    "Invalid chunk metadata for chunk_id=%s chunk_index=%s; ignoring metadata",
                    chunk_id,
                    chunk_index,
                )
                return {}

        if isinstance(parsed, dict):
            return parsed

        logger.warning(
            "Chunk metadata is not an object for chunk_id=%s chunk_index=%s; ignoring metadata",
            chunk_id,
            chunk_index,
        )
        return {}

    async def _fetch_document_names(
        self, db: AsyncSession, document_ids: List[str]
    ) -> dict[str, str]:
        from sqlalchemy import select, text
        from app.entities.document import Document

        if not document_ids:
            return {}

        unique_ids = list(set(document_ids))
        result = await db.execute(
            select(Document.id, Document.filename).where(
                Document.id.in_([UUID(did) for did in unique_ids])
            )
        )
        return {str(row[0]): row[1] for row in result.all()}

    def assemble_context(
        self,
        chunks: List[dict],
        document_names: Optional[dict[str, str]] = None,
        max_context_tokens: int = 4000,
    ) -> tuple[str, List[dict]]:
        context_parts = []
        citations = []
        current_tokens = 0
        doc_names = document_names or {}

        for i, chunk in enumerate(chunks):
            content = chunk["content"]
            doc_id = chunk["document_id"]
            doc_name = doc_names.get(doc_id, "Documento")
            metadata = chunk["metadata"] or {}
            page = metadata.get("page_number") or metadata.get("page")

            citation = {
                "index": i + 1,
                "document_id": doc_id,
                "document_name": doc_name,
                "chunk_index": chunk["chunk_index"],
                "page": page,
            }

            estimated_tokens = len(content) // 4

            if current_tokens + estimated_tokens > max_context_tokens:
                break

            if page:
                context_parts.append(
                    f'---\nFuente: "{doc_name}" (página {page})\n\n{content}'
                )
            else:
                context_parts.append(f'---\nFuente: "{doc_name}"\n\n{content}')

            citations.append(citation)
            current_tokens += estimated_tokens

        context = "\n".join(context_parts)
        return context, citations

    def format_messages(self, language: str = "en") -> ChatPromptTemplate:
        """
        Format messages for LangChain prompt.

        Args:
            language: Language code for LLM response (e.g., "en", "es")

        Returns:
            Formatted ChatPromptTemplate with context, query, and history as variables
        """
        language_instructions = {
            "en": "Respond in English.",
            "es": "Responde en español.",
        }
        lang_instruction = language_instructions.get(
            language, language_instructions["en"]
        )

        system_prompt = f"""You are a helpful assistant that answers questions based on the provided document sources.
Use only the information from the sources to answer. If the sources don't contain the answer, say so clearly.
Be concise and accurate. When referencing information, mention the document name naturally in your response (e.g., "According to document X..." or "In file Y it indicates that..."). Do NOT use [Source N] or numbered citation brackets. Instead, weave the source names into your prose naturally. If multiple sources are relevant, mention each one. At the end of your response, add a "Sources" section listing the documents you referenced.
{lang_instruction}"""

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                MessagesPlaceholder(variable_name="history", optional=True),
                ("human", "Sources:\n{context}\n\nQuestion: {query}"),
            ]
        )

        return prompt

    async def generate_response_stream(
        self,
        query: str,
        context: str,
        conversation_history: List[dict] | None = None,
        language: str = "en",
    ) -> AsyncIterator[str]:
        """
        Generate streaming response using LangChain.

        Args:
            query: User query
            context: Assembled context
            conversation_history: Optional conversation history
            language: Language code for LLM response

        Yields:
            Response tokens
        """
        try:
            prompt = self.format_messages(language)

            chain = prompt | self.chat_llm | StrOutputParser()

            input_vars: dict[str, str | list[dict]] = {
                "context": context,
                "query": query,
            }

            if conversation_history:
                input_vars["history"] = conversation_history

            async for token in chain.astream(input_vars):
                yield token

        except Exception as e:
            logger.error(f"Error generating response: {e}")
            raise

    async def answer_question(
        self,
        db: AsyncSession,
        user_id: UUID,
        query: str,
        document_ids: Optional[List[UUID]] = None,
        conversation_history: Optional[List[dict]] = None,
        top_k: int = 10,
        language: str = "en",
    ) -> dict:
        """
        Complete RAG pipeline: retrieve -> assemble -> generate.

        Args:
            db: Async database session
            user_id: User UUID
            query: User query
            document_ids: Optional document filter
            conversation_history: Optional conversation history
            top_k: Number of chunks to retrieve
            language: Language code for LLM response

        Returns:
            Dict with citations and streaming function
        """
        try:
            # Step 1: Generate query embedding
            logger.info(f"Generating embedding for query: {query[:50]}...")
            query_embedding = await self.generate_query_embedding(query)
            logger.debug(f"Query embedding (first 5): {query_embedding[:5]}")

            # Step 2: Retrieve relevant chunks
            logger.info(
                f"Retrieving chunks: threshold={settings.SIMILARITY_THRESHOLD}, "
                f"top_k={top_k}, doc_ids={document_ids}"
            )
            chunks = await self.retrieve_relevant_chunks(
                db, user_id, query_embedding, document_ids, top_k
            )

            if not chunks:
                logger.warning("No relevant chunks found")
                return {
                    "citations": [],
                    "stream": self._generate_no_context_response(query, language),
                }

            # Step 3: Assemble context
            logger.info("Assembling context...")
            doc_ids = [c["document_id"] for c in chunks]
            document_names = await self._fetch_document_names(db, doc_ids)
            context, citations = self.assemble_context(chunks, document_names)

            # Step 4: Generate streaming response
            logger.info("Generating response...")
            stream = self.generate_response_stream(
                query, context, conversation_history, language
            )

            return {"citations": citations, "stream": stream}

        except Exception as e:
            logger.error(f"Error in answer_question: {e}")
            raise

    async def _generate_no_context_response(
        self, query: str, language: str = "en"
    ) -> AsyncIterator[str]:
        """Generate response when no relevant context is found"""
        messages = {
            "en": "I couldn't find relevant information in the documents to answer your question. Please try rephrasing or upload additional documents.",
            "es": "No pude encontrar información relevante en los documentos para responder a tu pregunta. Intenta reformularla o sube documentos adicionales.",
        }
        yield messages.get(language, messages["en"])
