import React from "react";
import { Paper, Typography, Box } from "@mui/material";
import ReactMarkdown from "react-markdown";

export default function ChatResponse({ response, question }) {
  return (
    <Box sx={{ my: 3 }}>

      
      {question && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: 2,
          }}
        >
          <Paper
            sx={{
              p: 2,
              maxWidth: "70%",
              borderRadius: "18px 18px 4px 18px",
              background: "linear-gradient(135deg, #754305, #fc6100)",
              color: "#ffffff",
              fontWeight: "600",
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
            }}
          >
            {question}
          </Paper>
        </Box>
      )}

      {/* BOT ANSWER (LEFT SIDE) */}
      <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
        <Paper
          sx={{
            p: 3,
            maxWidth: "80%",
            borderRadius: "18px 18px 18px 4px",
            background: "rgba(255,255,255,0.1)",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
            backdropFilter: "blur(12px)",
          }}
        >
          <ReactMarkdown>{response}</ReactMarkdown>
        </Paper>
      </Box>

    </Box>
  );
}
