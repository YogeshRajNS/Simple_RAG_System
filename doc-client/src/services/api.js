import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000"; // FastAPI server

// Pass FormData directly from component
export const uploadFile = (formData) => {
  return axios.post(`${BASE_URL}/upload_file`, formData);
};

export const listDocs = () => axios.get(`${BASE_URL}/list_docs`);

export const deleteDocs = (docs) =>
  axios.delete(`${BASE_URL}/delete_docs`, { data: { docs } });


export const queryDocs = async (docs, query, message_history, onChunk) => {
  const response = await fetch(`${BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docs, query, message_history }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    onChunk(chunk);
  }
};

