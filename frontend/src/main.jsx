<<<<<<< HEAD
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
=======
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

const qc = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={qc}>
        <App />
        {/* 🔔 Global toast container */}
        <Toaster position="top-right" reverseOrder={false} />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
>>>>>>> major-changes
);
