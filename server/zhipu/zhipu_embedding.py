from typing import List, Any

from llama_index.embeddings.base import BaseEmbedding
from pydantic import PrivateAttr

from zhipu.zhipu_utils import invoke_embedding


class ZhiPuEmbedding(BaseEmbedding):
    _model: str = PrivateAttr()
    _instruction: str = PrivateAttr()

    def __init__(
            self,
            instructor_model_name: str = "text_embedding",
            instruction: str = "Represent a document for semantic search:",
            **kwargs: Any,
    ) -> None:
        # self._model = 'text_embedding'
        # self._instruction = instruction
        super().__init__(**kwargs)

    @classmethod
    def class_name(cls) -> str:
        return "zhipu_embeddings"

    async def _aget_query_embedding(self, query: str) -> List[float]:
        return self._get_query_embedding(query)

    async def _aget_text_embedding(self, text: str) -> List[float]:
        return self._get_text_embedding(text)

    def _get_query_embedding(self, query: str) -> List[float]:
        embeddings = invoke_embedding(query)
        return embeddings

    def _get_text_embedding(self, text: str) -> List[float]:
        embeddings = invoke_embedding(text)
        return embeddings

    def _get_text_embeddings(self, texts: List[str]) -> List[List[float]]:
        return [self._get_text_embedding(text) for text in texts]
