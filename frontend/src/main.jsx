import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import ConfirmProvider from "./components/ConfirmProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfirmProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
    </ConfirmProvider>
  </React.StrictMode>
);
