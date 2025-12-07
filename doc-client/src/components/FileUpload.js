import React, { useState } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import { useDropzone } from "react-dropzone";
import { uploadFile } from "../services/api";
import { toast } from "react-toastify";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export default function FileUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleUpload = async () => {
    if (!file) {
      toast.warning("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await uploadFile(formData);
      toast.success("File uploaded successfully!");
      setFile(null);
      onUploadSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed!");
    }
  };

  return (
    <Paper
      {...getRootProps()}
      sx={{
        p: 2,
        mb: 1,                          
        textAlign: "center",
        border: "2px dashed #4DB8FF",
        borderRadius: 3,
        background: "rgba(255,255,255,0.10)",
        color: "#ffffff",
        width: "87%",                
        minHeight: "70px",             
        cursor: "pointer",
        transition: "0.3s",
        "&:hover": {
          background: "rgba(255,255,255,0.18)",
          borderColor: "#82E0FF",
        },
      }}
    >
      <input {...getInputProps()} />

      <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
        {isDragActive ? "Drop file here..." : "Click or drag PDF and press upload to upload file"}
      </Typography>

      {file && (
        <Typography
          variant="caption"
          sx={{ color: "#A8C6FF", display: "block", mb: 1 }}
        >
          Selected: {file.name}
        </Typography>
      )}

      <Button
        variant="contained"
        startIcon={<CloudUploadIcon />}
        sx={{
          background: "linear-gradient(135deg, #f57002, #fa8619)",
          color: "#0A1628",
          fontWeight: "bold",
          borderRadius: 3,
          px: 2,
          py: 0.6,
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow: "0 0 10px rgba(255,255,255,0.4)",
          },
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleUpload();
        }}
      >
        Upload
      </Button>
    </Paper>
  );
}
