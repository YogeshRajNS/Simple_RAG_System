import React from "react";
import { Box, Paper, Typography, Checkbox } from "@mui/material";

export default function DocumentList({
  docs,
  selectedDocs,
  setSelectedDocs,
}) {
  const toggleSelect = (doc) => {
    if (selectedDocs.includes(doc)) {
      setSelectedDocs(selectedDocs.filter((d) => d !== doc));
    } else {
      setSelectedDocs([...selectedDocs, doc]);
    }
  };

  return (
    <Box>

      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: "bold", mb: 1 }}
      >
        Uploaded Documents
      </Typography>

      {/* 🔹 Scrollable Document Box */}
      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.25)",
          maxHeight: 300,
          overflowY: "auto",
        }}
      >
        {docs.length === 0 ? (
          <Typography sx={{ opacity: 0.8 }}>
            No documents uploaded yet.
          </Typography>
        ) : (
          docs.map((doc) => (
            <Box
              key={doc}
              sx={{
                display: "flex",
                alignItems: "center",
                py: 1,
                borderBottom: "1px dashed rgba(255,255,255,0.15)",
              }}
            >
              <Checkbox
                checked={selectedDocs.includes(doc)}
                onChange={() => toggleSelect(doc)}
                sx={{ color: "#fff" }}
              />
              <Typography sx={{ fontWeight: "bold" }}>
                {doc}
              </Typography>
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
}
