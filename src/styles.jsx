export const appStyle = {
  minHeight: "100vh",
  background: `
  linear-gradient(rgba(0,0,0,.6), rgba(0,0,0,.6)),
  url('/fondo.jpg') center / contain no-repeat
`,
backgroundColor: "#000",
  backgroundSize: "cover",
  backgroundPosition: "center",
  color: "white",
  fontFamily: "Segoe UI, sans-serif",
  padding: 20
};

export const cardStyle = {
  background: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(12px)",
  borderRadius: 22,
  padding: 25,
  maxWidth: 420,
  margin: "0 auto",
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
};

export const buttonStyle = {
  width: "100%",
  padding: "16px 0",
  fontSize: 20,
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
  marginTop: 12,
  fontWeight: "bold"
};

export const iconButton = {
  fontSize: 26,
  padding: "14px 18px",
  borderRadius: 14,
  margin: 6,
  cursor: "pointer",
  border: "none"
};