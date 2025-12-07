import React, { useState, useEffect, useRef } from "react";
import { Typography, Box, Paper } from "@mui/material";
import FileUpload from "./components/FileUpload";
import DocumentList from "./components/DocumentList";
import QueryBox from "./components/QueryBox";
import ChatResponse from "./components/ChatResponse";
import { listDocs, deleteDocs, queryDocs } from "./services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ICON IMPORTS
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DescriptionIcon from "@mui/icons-material/Description";


const TypingDots = () => (
  <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
    <Paper
      sx={{
        p: 2,
        maxWidth: "70%",
        borderRadius: "18px 18px 18px 4px",
        background: "rgba(255,255,255,0.1)",
        color: "#fff",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="typing-wave">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </Paper>
  </Box>
);


const typeText = async (text, setter) => {
  for (let i = 0; i < text.length; i++) {
    setter(prev => prev + text[i]);
    await new Promise(res => setTimeout(res, 8)); 
  }
};


function App() {
  const [docs, setDocs] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [currentQuestion,setCurrentQuestion] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);


  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, streamingAnswer]);


  
  const fetchDocs = async () => {
    try {
      const res = await listDocs();
      setDocs(res.data.docs);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch docs.");
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);


  
  const handleDelete = async (docNames) => {
    try {
      await deleteDocs(docNames);
      toast.success("Deleted successfully!");
      fetchDocs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete.");
    }
  };
  const buildMessageHistory = () => {
    return chatHistory
      .map(msg => `Assistant: ${msg.answer || ""}`)
      .join("\n\n");
  };
  
  


  const handleQuery = async (query) => {

    
    setChatHistory(prev => [
      ...prev,
      { question: query, answer: null }
    ]);
  
    setCurrentQuestion(query);
    setStreamingAnswer("");
    setIsTyping(true);
  
    let finalAnswer = "";
    let firstChunk = true;
  
    const docsToSend = selectedDocs.length > 0 ? selectedDocs : docs;
  
    const historyString = buildMessageHistory();
  
    await queryDocs(docsToSend, query, historyString, (chunk) => {
      if (firstChunk) {
        setIsTyping(false);
        firstChunk = false;
      }
  
      finalAnswer += chunk;
      setStreamingAnswer(prev => prev + chunk);
    });

    setChatHistory(prev => {
      const arr = [...prev];
      arr[arr.length - 1].answer = finalAnswer;
      return arr;
    });
  
    setStreamingAnswer("");
    setIsTyping(false);
  };
  
  

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #ff6f00, #ffb74d)",
        color: "#ffffff",
        position: "relative"
      }}
    >

     
<Box
  sx={{
    width: "300px",
    p: 3,
    borderRight: "2px solid rgba(255,255,255,0.2)",
    background: "rgba(0,0,0,0.2)",
    backdropFilter: "blur(10px)",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  }}
>
  
  <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
    Menu
  </Typography>

  
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
    <CloudUploadIcon sx={{ color: "#4DB8FF" }} />
    <Typography variant="h6">Upload File</Typography>
  </Box>

  <FileUpload onUploadSuccess={fetchDocs} />

 
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
    <DescriptionIcon sx={{ color: "#4DB8FF" }} />
    <Typography variant="h6">Documents</Typography>
  </Box>

 
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
    <label>
      <input
        type="checkbox"
        checked={selectedDocs.length === docs.length && docs.length > 0}
        onChange={(e) => {
          if (e.target.checked) setSelectedDocs(docs);
          else setSelectedDocs([]);
        }}
      />
      &nbsp;Select All
    </label>

    <button
  onClick={() => {
    if (selectedDocs.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    const deletingAll = selectedDocs.length === docs.length;

    const confirmDelete = window.confirm(
      deletingAll
        ? "Are you sure you want to delete ALL documents?"
        : "Are you sure you want to delete the selected document(s)?"
    );

    if (confirmDelete) {
      handleDelete(selectedDocs);
      setSelectedDocs([]);
    }
  }}
  disabled={selectedDocs.length === 0}
  style={{
    background: "#f77d36",
    color: "white",
    border: "none",
    height:"10hv",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer"
  }}
>
  DELETE
</button>

  </Box>


  <Box
    
    sx={{
      flexGrow: 1,
      overflowY: "auto",
      mt: 2,
      pr: 1
    }}
  >
    <DocumentList
      docs={docs}
      onDelete={handleDelete}
      selectedDocs={selectedDocs}
      setSelectedDocs={setSelectedDocs}
    />
  </Box>
</Box>



      
      <Box
        sx={{
          flexGrow: 1,
          p: 4,
          display: "flex",
          flexDirection: "column",
          height: "100vh"
        }}
      >

       
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            pr: 2,
            mb: 12
          }}
        >
          <Typography
            variant="h3"
            align="center"
            gutterBottom
            sx={{ fontWeight: "bold", mb: 4 }}
          >
            Document Q&A System
          </Typography>

          
          {chatHistory.slice(0, -1).map((chat, index) => (
            <ChatResponse
              key={index}
              question={chat.question}
              response={chat.answer}
            />
          ))}

          
          {chatHistory.length > 0 && (
            <ChatResponse
              question={chatHistory[chatHistory.length - 1].question}
              response={
                isTyping
                  ? ""  
                  : streamingAnswer || chatHistory[chatHistory.length - 1].answer
              }
            />
          )}

          
          {isTyping && <TypingDots />}


          <div ref={messagesEndRef} />
        </Box>


        
        <Box
          sx={{
            position: "fixed",
            bottom: 20,
            left: 340,
            right: 20,
            zIndex: 100
          }}
        >
          <QueryBox onSubmit={handleQuery} />
        </Box>

      </Box>

      <ToastContainer />
    </Box>
  );
}

export default App;
