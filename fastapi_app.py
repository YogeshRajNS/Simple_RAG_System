import os
import fitz
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import json

with open("api.json","r") as f:
    api=json.load(f)
genai.configure(api_key=api['api_key']) 


class docExtractor:
    def __init__(self, collection_name="doc_collection"):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.chroma_client = chromadb.PersistentClient(path="./chroma_store")
        self.collection = self.chroma_client.get_or_create_collection(name=collection_name)

    def pdf_extractor(self, file_path: str):
        pdf_data = fitz.open(file_path)
        data = []
        for page in pdf_data:
            page_number = page.number + 1
            text = page.get_text()
            data.append({"page_number": page_number, "text": text})
        return data

    def create_embeddings(self, pdf_texts):
        for page in pdf_texts:
            text = page["text"]
            embedding = self.model.encode(text)
            page["vector"] = embedding
        return pdf_texts

    def store_to_chromadb(self, data, doc_name):
        for item in data:
            self.collection.add(
                documents=[item["text"]],
                embeddings=[item["vector"]],
                metadatas=[{"page_number": item["page_number"], "doc_name": doc_name}],
                ids=[f"{doc_name}_page_{item['page_number']}"]
            )

    def retrieve(self, query, file_names: List[str], top_k=3):
        query_embedding = self.model.encode(query).tolist()
        if file_names:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where={"doc_name": {"$in": file_names}},
            )
        else:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k
            )
        print(results)
        names = results["ids"][0]
        documents = results["documents"][0]
        data = dict(zip(names, documents))
        return data

    def retrieve_doc_name_list(self):
        results = self.collection.get(include=["metadatas"])
        doc_names = [
            meta.get("doc_name")
            for meta in results["metadatas"]
            if "doc_name" in meta
        ]
        unique_doc_names = sorted(set(doc_names))
        return unique_doc_names

    def delete_docs(self, doc_names: List[str]):
        results = self.collection.get(include=["metadatas"])
        ids_to_delete = [
            doc_id
            for doc_id, meta in zip(results["ids"], results["metadatas"])
            if meta.get("doc_name") in doc_names
        ]
        if ids_to_delete:
            self.collection.delete(ids=ids_to_delete)
        return ids_to_delete


def answer_with_gemini(query, retrieved_docs):
    context = "\n\n".join(retrieved_docs.values())
    prompt = f"""
You are a helpful assistant. Answer the following question strictly based on the provided doc content.

doc Content:
{context}

Question:
{query}

Answer:
- Only use information from the doc.
- Avoid adding any outside knowledge.
- Keep answers clear and concise.
- Use bullet points if multiple points exist.
- I want response in markdown
"""
    model = genai.GenerativeModel("models/gemini-2.0-flash")
    response = model.generate_content(prompt)
    return response.text



app = FastAPI()
os.makedirs("./uploads", exist_ok=True)


class QueryRequest(BaseModel):
    docs: List[str]
    query: str

class DeleteRequest(BaseModel):
    docs: List[str]




@app.post("/upload_file")
async def upload_file(file: UploadFile = File(...)):
    doc_extractor = docExtractor(collection_name="my_doc_2")

    file_location = f"./uploads/{file.filename}"
    with open(file_location, "wb") as f:
        f.write(await file.read())

    pdf_pages = doc_extractor.pdf_extractor(file_location)
    embedded_pages = doc_extractor.create_embeddings(pdf_pages)
    doc_extractor.store_to_chromadb(embedded_pages, doc_name=file.filename)

    return {"message": f"doc {file.filename} uploaded successfully!"}


@app.get("/list_docs")
async def list_docs():
    doc_extractor = docExtractor(collection_name="my_doc_2")

    docs = doc_extractor.retrieve_doc_name_list()
    return {"docs": docs}


@app.delete("/delete_docs")
async def delete_docs(input_data: DeleteRequest):
    doc_extractor = docExtractor(collection_name="my_doc_2")

    deleted_ids = doc_extractor.delete_docs(input_data.docs)
    return {"deleted_ids": deleted_ids}


@app.post("/query")
async def query_doc(input_data: QueryRequest):
    doc_extractor = docExtractor(collection_name="my_doc_2")

    results = doc_extractor.retrieve(input_data.query, file_names=input_data.docs)
    answer = answer_with_gemini(input_data.query, results)
    return answer
