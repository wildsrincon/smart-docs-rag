from pydantic import BaseModel
from uuid import UUID
from typing import Optional, Literal


class DocumentStatusUpdate(BaseModel):
    document_id: UUID
    status: str
    progress: int  # 0-100
    message: Optional[str]


# Chat Schemas
class UserQueryData(BaseModel):
    text: str
    document_id: Optional[UUID] = None
    conversation_id: Optional[UUID] = None


class UserQueryMessage:
    type: Literal["user_query"] = "user_query"


class AssistantResponseData(BaseModel):
    token: str
    done: bool


class AssistantResponseMessage:
    type: Literal["assistant_response"] = "assistant_response"


class ErrorData:
    code: str
    message: str


class ErrorMessage:
    type: Literal["error"] = "error"


class StatusData:
    state: str
    conversation_id: Optional[UUID] = None


class StatusMessage:
    type: Literal["status"] = "status"


class DocumentStatusData:
    document_id: UUID
    status: str
    progress: int


class DocumentStatusMessage:
    type: Literal["document_status"] = "document_status"


# WebSocket Message Schemas
class WebSocketMessage:
    type: Literal[
        "user_query", "assistant_response", "error", "status", "document_status"
    ]


# Chat Schemas
class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[UUID] = None
    document_ids: Optional[list[UUID]] = None


class ChatResponse(BaseModel):
    conversation_id: UUID
    message_id: UUID
    response: str
    citations: list[dict]


# Embedding Schemas
class EmbeddingRequest(BaseModel):
    text: str


class EmbeddingResponse(BaseModel):
    embedding: list[float]
    tokens: int
