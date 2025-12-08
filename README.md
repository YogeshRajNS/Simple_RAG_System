# Simple_RAG_System
steps to run backend(Fastapi)

step 1:
python -m venv venv

step 2:
venv\scripts\activate

step 3:
pip install -r requirements.txt

step 4:
uvicorn fastapi_app:app --reload --port 8000


For frontend(React):
steps to run frontend 

step 1:
cd doc-client

step 2:
install:
        npm install @mui/material @emotion/react @emotion/styled
        npm install react-dropzone react-icons
        npm install axios react-toastify
        npm install @mui/icons-material

step 3:
npm start
