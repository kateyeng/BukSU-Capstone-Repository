import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

const qc = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  //<React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={qc}>
        <App />
        {/* 🔔 Global toast container */}
        <Toaster position="top-right" reverseOrder={false} />
      </QueryClientProvider>
    </BrowserRouter>
  //</React.StrictMode>
);
