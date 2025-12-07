import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#e8cfa9" }, // neon blue
    secondary: { main: "#82E0FF" },
    background: {
      default: "#e8cfa9", // deep navy
      paper: "rgba(255, 255, 255, 0.08)" // glassmorphism
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#e8cfa9"
    }
  },

  typography: {
    fontFamily: "'Poppins', sans-serif",
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    body1: { lineHeight: 1.7 }
  },

  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(12px)",
          background: "rgba(255,140,0,0.6)",
          borderRadius: "28px",
          border: "1px solid rgba(255,140,0,0.6)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          padding: "24px"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "14px",
          fontWeight: "600",
          padding: "10px 24px",
          background: "linear-gradient(135deg, #f57002, #fa8619)",
          color: "#0A1628",
          "&:hover": {
            transform: "scale(1.03)",
            boxShadow: "0 0 18px rgba(255,140,0,0.6)"
          }
        }
      }
    }
  }
});

export default theme;
