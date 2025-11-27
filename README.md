# Simple_RAG_System
steps to run

step 1:
python -m venv venv

step 2:
venv\scripts\activate

step 3:
pip install -r requirements.txt

step 4:
uvicorn fastapi_app:app --reload --port 8000
