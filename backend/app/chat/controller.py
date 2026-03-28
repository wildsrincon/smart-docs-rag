"""Chat controller for RAG platform"""

import logging
from typing import List, Annotated

from fastapi import (
    APIRouter,
    Depends,
    status,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    Query,
)
from uuid import UUID

from app.auth.service import verify_token
from app.chat.model import ConversationCreate, ConversationResponse, ChatHistoryResponse
from app.chat.service import ChatService
from app.database.core import AsyncSession, get_db
from app.rag.websocket_handler import websocket_handler

router = APIRouter(prefix="/chat", tags=["Chat"])
chat_service = ChatService()

# Type alias for dependency injection
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    db: DbSession, conversation: ConversationCreate, token: str = Query(...)
):
    """Create a new conversation"""
    token_data = verify_token(token)
    user_id = UUID(token_data.user_id)
    return await chat_service.create_conversation(db, user_id, conversation.title)


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    db: DbSession, token: str = Query(...), skip: int = 0, limit: int = 100
):
    """List all conversations for the authenticated user"""
    token_data = verify_token(token)
    user_id = UUID(token_data.user_id)
    return await chat_service.get_conversations(db, user_id, skip, limit)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    db: DbSession, conversation_id: UUID, token: str = Query(...)
):
    """Get a specific conversation by ID"""
    token_data = verify_token(token)
    user_id = UUID(token_data.user_id)
    conversation = await chat_service.get_conversation(db, conversation_id, user_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.get(
    "/conversations/{conversation_id}/history", response_model=ChatHistoryResponse
)
async def get_conversation_history(
    db: DbSession, conversation_id: UUID, token: str = Query(...)
):
    """Get message history for a conversation"""
    token_data = verify_token(token)
    user_id = UUID(token_data.user_id)
    messages = await chat_service.get_conversation_history(db, conversation_id, user_id)
    if messages is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ChatHistoryResponse(conversation_id=conversation_id, messages=messages)


@router.delete(
    "/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_conversation(
    db: DbSession, conversation_id: UUID, token: str = Query(...)
):
    """Delete a conversation and its messages"""
    token_data = verify_token(token)
    user_id = UUID(token_data.user_id)
    deleted = await chat_service.delete_conversation(db, conversation_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")


@router.websocket("/ws")
async def websocket_chat(websocket: WebSocket, token: str):
    """
    WebSocket endpoint for real-time RAG chat.

    Message types:
    - user_query: Send a query to the RAG system
    - assistant_response: Streamed response tokens
    - status: Status updates (processing, complete, error)
    - document_status: Document ingestion status updates
    - error: Error messages
    """
    # Authenticate connection
    success, error_message, user_id = await websocket_handler.connect(websocket, token)

    if not success:
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION, reason=error_message
        )
        return

    # Create database session for this connection
    async for db in get_db():
        try:
            # Listen for messages
            while True:
                # Receive message from client
                message = await websocket.receive_json()

                # Route message to appropriate handler
                await websocket_handler.handle_message(websocket, message, user_id, db)

        except WebSocketDisconnect:
            logging.info(f"WebSocket disconnected: user {user_id}")
            websocket_handler.disconnect(user_id)
            break
        except Exception as e:
            logging.error(f"WebSocket error: {e}")
            await websocket_handler.send_error(user_id, "INTERNAL_ERROR", str(e))
            websocket_handler.disconnect(user_id)
            break
        finally:
            await db.close()
