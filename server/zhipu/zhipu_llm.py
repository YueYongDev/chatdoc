from typing import Any

from llama_index.llms import CustomLLM
from llama_index.llms.base import llm_completion_callback, CompletionResponse, LLMMetadata, CompletionResponseGen

from zhipu.zhipu_utils import invoke_prompt


class ZhiPuLLM(CustomLLM):
    model_name: str = "glm-4"

    @property
    def metadata(self) -> LLMMetadata:
        """Get LLM metadata."""
        return LLMMetadata(
            model_name=self.model_name,
        )

    @llm_completion_callback()
    def complete(self, prompt: str, **kwargs: Any) -> CompletionResponse:
        response = invoke_prompt(prompt)
        return CompletionResponse(text=response)

    @llm_completion_callback()
    def stream_complete(
            self, prompt: str, **kwargs: Any
    ) -> CompletionResponseGen:
        response = ""
        for token in self.dummy_response:
            response += token
            yield CompletionResponse(text=response, delta=token)
