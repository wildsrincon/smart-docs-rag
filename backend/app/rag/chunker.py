"""Semantic chunking for RAG platform"""

import logging
import tiktoken

from app.core.config import settings

logger = logging.getLogger(__name__)


class Chunker:
    """Handles semantic chunking of text for RAG processing"""

    def __init__(
        self,
        min_tokens: int | None = None,
        max_tokens: int | None = None,
        overlap_ratio: float = 0.2,
        encoding_name: str = "cl100k_base",  # OpenAI's encoding
    ):
        self.min_tokens = min_tokens or settings.CHUNK_MIN_TOKENS
        self.max_tokens = max_tokens or settings.CHUNK_MAX_TOKENS
        self.overlap_ratio = overlap_ratio
        self.encoding = tiktoken.get_encoding(encoding_name)

    def count_tokens(self, text: str) -> int:
        """Count tokens in text using tiktoken"""
        try:
            return len(self.encoding.encode(text))
        except Exception as e:
            logger.error(f"Error counting tokens: {e}")
            return 0

    def split_text_by_paragraphs(self, text: str) -> list[str]:
        """Split text into paragraphs"""
        # Split by double newlines or single newlines followed by whitespace
        paragraphs = []
        current_paragraph = ""

        for line in text.split("\n"):
            stripped_line = line.strip()
            if stripped_line:
                current_paragraph += stripped_line + " "
            else:
                if current_paragraph.strip():
                    paragraphs.append(current_paragraph.strip())
                    current_paragraph = ""

        if current_paragraph.strip():
            paragraphs.append(current_paragraph.strip())

        return paragraphs if paragraphs else [text]

    def create_chunks(self, text: str, metadata: dict | None = None) -> list[dict]:
        """
        Create semantic chunks from text with token limits and overlap

        Args:
            text: Input text to chunk
            metadata: Optional metadata to attach to chunks

        Returns:
            List of chunk dictionaries with content, token_count, and metadata
        """
        paragraphs = self.split_text_by_paragraphs(text)
        chunks = []
        current_chunk = ""
        current_tokens = 0
        chunk_index = 0
        overlap_tokens = int(self.max_tokens * self.overlap_ratio)

        for paragraph in paragraphs:
            paragraph_tokens = self.count_tokens(paragraph)

            # Handle case where single paragraph exceeds max_tokens
            if paragraph_tokens > self.max_tokens:
                # Save current chunk if it has content and meets minimum
                if current_tokens >= self.min_tokens:
                    chunk_data = {
                        "content": current_chunk.strip(),
                        "token_count": current_tokens,
                        "chunk_index": chunk_index,
                        "metadata": metadata,
                    }
                    chunks.append(chunk_data)
                    chunk_index += 1

                # Split the large paragraph into multiple chunks
                words = paragraph.split()
                temp_chunk = ""
                temp_tokens = 0

                for word in words:
                    word_tokens = self.count_tokens(word + " ")
                    if temp_tokens + word_tokens > self.max_tokens:
                        if temp_tokens >= self.min_tokens:
                            chunk_data = {
                                "content": temp_chunk.strip(),
                                "token_count": temp_tokens,
                                "chunk_index": chunk_index,
                                "metadata": metadata,
                            }
                            chunks.append(chunk_data)
                            chunk_index += 1

                        # Start new chunk with overlap
                        if overlap_tokens > 0 and len(chunks) > 0:
                            previous_chunk = chunks[-1]["content"]
                            overlap_text = self._get_overlap_text(
                                previous_chunk, overlap_tokens
                            )
                            temp_chunk = overlap_text + " "
                            temp_tokens = self.count_tokens(temp_chunk)
                        else:
                            temp_chunk = ""
                            temp_tokens = 0

                    temp_chunk += word + " "
                    temp_tokens += word_tokens

                # Add remaining content from large paragraph
                if temp_tokens >= self.min_tokens:
                    chunk_data = {
                        "content": temp_chunk.strip(),
                        "token_count": temp_tokens,
                        "chunk_index": chunk_index,
                        "metadata": metadata,
                    }
                    chunks.append(chunk_data)
                    chunk_index += 1

                # Reset current chunk
                current_chunk = ""
                current_tokens = 0
                continue

            # If adding this paragraph would exceed max tokens
            if current_tokens + paragraph_tokens > self.max_tokens:
                # Save current chunk if it meets minimum size
                if current_tokens >= self.min_tokens:
                    chunk_data = {
                        "content": current_chunk.strip(),
                        "token_count": current_tokens,
                        "chunk_index": chunk_index,
                        "metadata": metadata,
                    }
                    chunks.append(chunk_data)
                    chunk_index += 1

                    # Start new chunk with overlap
                    if overlap_tokens > 0 and len(chunks) > 0:
                        # Get overlap from previous chunk
                        previous_chunk = chunks[-1]["content"]
                        overlap_text = self._get_overlap_text(
                            previous_chunk, overlap_tokens
                        )
                        current_chunk = overlap_text
                        current_tokens = self.count_tokens(current_chunk)
                    else:
                        current_chunk = ""
                        current_tokens = 0

            # Add paragraph to current chunk
            current_chunk += paragraph + " "
            current_tokens += paragraph_tokens

            # Check if current chunk exceeds max after adding paragraph
            if current_tokens > self.max_tokens:
                # Split the current chunk
                chunk_data = {
                    "content": current_chunk.strip(),
                    "token_count": current_tokens,
                    "chunk_index": chunk_index,
                    "metadata": metadata,
                }
                chunks.append(chunk_data)
                chunk_index += 1

                # Start new chunk with overlap
                if overlap_tokens > 0 and len(chunks) > 0:
                    previous_chunk = chunks[-1]["content"]
                    overlap_text = self._get_overlap_text(
                        previous_chunk, overlap_tokens
                    )
                    current_chunk = overlap_text
                    current_tokens = self.count_tokens(current_chunk)
                else:
                    current_chunk = ""
                    current_tokens = 0

        # Add final chunk
        if current_tokens >= self.min_tokens:
            chunk_data = {
                "content": current_chunk.strip(),
                "token_count": current_tokens,
                "chunk_index": chunk_index,
                "metadata": metadata,
            }
            chunks.append(chunk_data)

        logger.info(
            f"Created {len(chunks)} chunks from text ({sum(c['token_count'] for c in chunks)} total tokens)"
        )
        return chunks

    def _get_overlap_text(self, text: str, overlap_tokens: int) -> str:
        """Extract overlap text from end of previous chunk"""
        tokens = self.encoding.encode(text)
        overlap_tokens_list = tokens[-overlap_tokens:] if overlap_tokens > 0 else []
        return self.encoding.decode(overlap_tokens_list)

    def validate_chunk_size(self, chunk: dict) -> bool:
        """Validate that chunk meets size requirements"""
        token_count = chunk.get("token_count", 0)
        return self.min_tokens <= token_count <= self.max_tokens
