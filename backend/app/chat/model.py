from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List

from ..entities.message import MessageRole


class ConversationCreate(BaseModel):
    title: str


class ConversationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    conversation_id: UUID
    role: MessageRole
    content: str
    document_ids: Optional[List[UUID]] = None


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    user_id: UUID
    role: MessageRole
    content: str
    tokens: Optional[int]
    document_ids: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatHistoryResponse(BaseModel):
    conversation_id: UUID
    messages: List[MessageResponse]
