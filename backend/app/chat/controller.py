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
)
from uuid import UUID

from app.auth.model import TokenData
from app.auth.service import get_current_user
from app.chat.model import (
    ConversationCreate,
    ConversationResponse,
    ConversationTitleUpdate,
    ChatHistoryResponse,
)
from app.chat.service import ChatService
from app.database.core import AsyncSession, get_db
from app.rag.websocket_handler import websocket_handler

router = APIRouter(prefix="/chat", tags=["Chat"])
chat_service = ChatService()

# Type aliases for dependency injection
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[TokenData, Depends(get_current_user)]


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    db: DbSession, conversation: ConversationCreate, current_user: CurrentUser
):
    """Create a new conversation"""
    user_id = UUID(current_user.user_id)
    return await chat_service.create_conversation(db, user_id, conversation.title)


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    db: DbSession, current_user: CurrentUser, skip: int = 0, limit: int = 100
):
    """List all conversations for the authenticated user"""
    user_id = UUID(current_user.user_id)
    return await chat_service.get_conversations(db, user_id, skip, limit)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    db: DbSession, conversation_id: UUID, current_user: CurrentUser
):
    """Get a specific conversation by ID"""
    user_id = UUID(current_user.user_id)
    conversation = await chat_service.get_conversation(db, conversation_id, user_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.get(
    "/conversations/{conversation_id}/history", response_model=ChatHistoryResponse
)
async def get_conversation_history(
    db: DbSession, conversation_id: UUID, current_user: CurrentUser
):
    """Get message history for a conversation"""
    user_id = UUID(current_user.user_id)
    messages = await chat_service.get_conversation_history(db, conversation_id, user_id)
    if messages is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ChatHistoryResponse(conversation_id=conversation_id, messages=messages)


@router.put(
    "/conversations/{conversation_id}/title",
    response_model=ConversationResponse,
)
async def update_conversation_title(
    db: DbSession,
    conversation_id: UUID,
    body: ConversationTitleUpdate,
    current_user: CurrentUser,
):
    """Update a conversation's title"""
    user_id = UUID(current_user.user_id)
    conversation = await chat_service.update_conversation_title(
        db, conversation_id, user_id, body.title
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.delete(
    "/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_conversation(
    db: DbSession, conversation_id: UUID, current_user: CurrentUser
):
    """Delete a conversation and its messages"""
    user_id = UUID(current_user.user_id)
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
        # Send error message before closing connection
        try:
            await websocket.accept()
            await websocket.send_json(
                {
                    "type": "error",
                    "data": {
                        "code": "AUTH_FAILED",
                        "message": error_message or "Authentication failed",
                    },
                }
            )
        except Exception:
            pass
        finally:
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION, reason=error_message
            )
        return

    try:
        while True:
            message = await websocket.receive_json()

            try:
                async for db in get_db():
                    await websocket_handler.handle_message(
                        websocket, message, user_id, db
                    )
            except WebSocketDisconnect:
                raise
            except Exception as msg_err:
                logging.error(f"Error processing message: {msg_err}")
                await websocket_handler.send_error(
                    user_id, "MESSAGE_ERROR", str(msg_err)
                )

    except WebSocketDisconnect:
        logging.info(f"WebSocket disconnected: user {user_id}")
        websocket_handler.disconnect(user_id)
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        await websocket_handler.send_error(user_id, "INTERNAL_ERROR", str(e))
        websocket_handler.disconnect(user_id)
