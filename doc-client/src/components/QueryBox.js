import React, { useState } from "react";
import { Box, TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

export default function QueryBox({ onSubmit }) {
  const [query, setQuery] = useState("");

  const handleSubmit = () => {
    if (query.trim()) {
      onSubmit(query);
      setQuery("");
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 30,
        right: 30,
        left: 386,
        display: "flex",
        gap: 2,
        alignItems: "center",
        zIndex: 10,
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Ask a question..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: 3,
          "& input": { color: "#ffffff" },
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "#ffffff" },
            "&:hover fieldset": { borderColor: "#ffe0b2" },
            "&.Mui-focused fieldset": { borderColor: "#ffffff" },
            borderRadius: 3,
          },
        }}
      />

     
      <IconButton
        onClick={handleSubmit}
        sx={{
          background: "linear-gradient(135deg, #f57002, #fa8619)",
          color: "#0A1628",
          p: 2,
          borderRadius: "12px",
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow: "0 0 10px rgba(255,140,0,0.6)",
          },
        }}
      >
        <SendIcon />
      </IconButton>
    </Box>
  );
}
