import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { GoogleOAuthProvider } from '@react-oauth/google'

createRoot(document.getElementById("root")).render(
  <StrictMode>
      <GoogleOAuthProvider clientId="849721912369-qu83hvjreuq3mb7jpno5lj8mo9t0q2re.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
  </StrictMode>
);
