import os
import fitz
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse,StreamingResponse
from pydantic import BaseModel
from typing import List
import json
import re
from fastapi.middleware.cors import CORSMiddleware



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

def check_with_gemini(prompt):
    model = genai.GenerativeModel("models/gemini-2.5-flash")
    response = model.generate_content(prompt)
    response = response.text
    match = re.search(r'\$\$(.*?)\$\$', response, re.DOTALL) 
    if match: 
        print("***match found**", response) 
        response = match.group(1)
    match = re.search(r'json\s*(.*)', response, re.DOTALL) 
    if match: 
        response = match.group(1) # Remove any trailing triple backticks if they exist 
    response = re.sub(r'```', '', response).strip()
    return response


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
    model = genai.GenerativeModel("models/gemini-2.5-flash")
    # response = model.generate_content(prompt)
    # return response.text
    answer =""
    response = model.generate_content(prompt, stream=True)
    for chunk in response:
        yield chunk.text
        answer += chunk.text
        print(chunk.text, end="")
    print("\n\n#############",{"question": query, "answer": answer},"#######\n\n")

app = FastAPI()
os.makedirs("./uploads", exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    docs: List[str]
    query: str
    message_history:str

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
    try:
        os.remove(file_location)
    except Exception as e:
        print("error",e)

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
    prompt = f"""You will receive:
- A conversation history inside <message_history>
- A current user query inside <user_question>

Your task:
1. Determine whether the current user question depends on the previous conversation.

<message_history>
{input_data.message_history} 
</message_history>
<user_question>
{input_data.query}
</user_question>
2. If it depends:
   - Summarize only the relevant parts of the message history.
   - Rephrase the user's current question into a complete standalone question.
   - Return your answer ONLY.


3. If it does NOT depend on the conversation history:
   Return exactly:
None

Rules:
- Do NOT add explanation.
- Do NOT invent missing details.
- Output must follow the format strictly.
- just return the rephrased output or "none" in in between double dollar without any explanation.
return the output in between double dollar like $$...$$.
"""
    question = input_data.query
    check_question = check_with_gemini(prompt)
    print(check_question)
    if check_question.lower() !="none":
        question = check_question

    doc_extractor = docExtractor(collection_name="my_doc_2")

    results = doc_extractor.retrieve(question, file_names=input_data.docs)
    # return answer_with_gemini(input_data.query, results)
    return StreamingResponse(answer_with_gemini(question, results), media_type="text/plain")
