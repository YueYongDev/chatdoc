import logging
import os
import sys

import docx2txt
from PyPDF2 import PdfReader
from epub2txt import epub2txt
from llama_index import SimpleDirectoryReader, ServiceContext, VectorStoreIndex, StorageContext, \
    load_index_from_storage
from llama_index import download_loader
from zhipu.zhipu_embedding import ZhiPuEmbedding
from zhipu.zhipu_llm import ZhiPuLLM

from common.consts import BASE_DIR,PERSIST_DIR

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logging.getLogger().addHandler(logging.StreamHandler(stream=sys.stdout))

API_TOKEN_TTL_SECONDS = 3 * 60
CACHE_TTL_SECONDS = API_TOKEN_TTL_SECONDS - 30

llm = ZhiPuLLM()
embed_model = ZhiPuEmbedding()

service_context = ServiceContext.from_defaults(
    llm=llm, embed_model=embed_model
)
CJKPDFReader = download_loader("CJKPDFReader")
SimpleWebPageReader = download_loader("SimpleWebPageReader")

class Doc:
    def __init__(
            self,
            doc_id: str,
            filename: str = ""
    ) -> None:
        self.dir_name = doc_id

        full_dir = os.path.join(BASE_DIR, self.dir_name)
        if not os.path.exists(full_dir):
            os.makedirs(full_dir)

        self.filename = filename
        self.file_path = os.path.join(BASE_DIR, self.dir_name, filename)
        self.data_file = os.path.join(BASE_DIR, self.dir_name, "data.txt")
        self.index_file = os.path.join(BASE_DIR, self.dir_name, "index.json")

    async def save(self, content: bytes):
        with open(self.file_path, "wb") as f:
            f.write(content)

    def build_txt(self, doc_type: str):
        if doc_type == 'application/epub+zip':
            self.extract_epub()
        if doc_type == 'application/pdf':
            self.extract_pdf()
        if doc_type == 'text/plain' or doc_type == 'text/markdown':
            self.data_file = self.file_path
        if doc_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            self.extra_docx()

    def extract_epub(self):
        res = epub2txt(self.file_path)
        with open(self.data_file, "a") as file:
            for i in range(len(res)):
                file.write(res[i])

    def extract_pdf(self):
        reader = PdfReader(self.file_path)
        print("total pages ", len(reader.pages))
        with open(self.data_file, "a") as file:
            for i in range(len(reader.pages)):
                page = reader.pages[i]
                text = page.extract_text()
                file.write(text)

    def extra_docx(self):
        res = docx2txt.process(self.file_path)
        with open(self.data_file, "a") as file:
            file.write(res)

    def build_index(self, doc_type: str):
        print(doc_type)
        if doc_type == 'web':
            self.build_web()
            return

        documents = SimpleDirectoryReader(
            input_files=[self.data_file]).load_data()
        print("prepare build index")
        index = VectorStoreIndex.from_documents(documents, service_context=service_context)
        print("build index finish")
        index.storage_context.persist(persist_dir=PERSIST_DIR)

    def build_web(self):
        loader = SimpleWebPageReader()
        documents = loader.load_data(urls=[self.filename])
        index = VectorStoreIndex.from_documents(documents, service_context=service_context)
        index.storage_context.persist(persist_dir=PERSIST_DIR)

    def query(self, question: str):
        print("query2", self.index_file, self.file_path)
        loader = CJKPDFReader()
        index_file = self.index_file

        if os.path.exists(index_file) == False:
            documents = loader.load_data(file=self.file_path)
            index = VectorStoreIndex.from_documents(documents, service_context=service_context)
            index.storage_context.persist(persist_dir=PERSIST_DIR)
        else:
            storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
            index = load_index_from_storage(storage_context)

        query_engine = index.as_query_engine()

        return query_engine.query(question)

    def query2(self, question: str):
        print("query2", self.index_file, self.file_path)
        loader = CJKPDFReader()
        index_file = self.index_file

        print(os.path.exists(index_file))
        if os.path.exists(index_file) == False:
            documents = loader.load_data(file=self.file_path)
            index = VectorStoreIndex.from_documents(documents, service_context=service_context)
            index.storage_context.persist(persist_dir=PERSIST_DIR)
        else:
            storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
            index = load_index_from_storage(storage_context)

        query_engine = index.as_query_engine()

        return query_engine.query(question)
