import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.scss";
import { AuthProvider } from "./context/AuthContext";

const materialIconSelector = ".material-symbols-outlined, .material-icons";

const markIconElementsAsNoTranslate = (root = document) => {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll(materialIconSelector).forEach((node) => {
    node.setAttribute("translate", "no");
    node.classList.add("notranslate");
  });
};

markIconElementsAsNoTranslate();

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) return;
      if (node.matches?.(materialIconSelector)) {
        node.setAttribute("translate", "no");
        node.classList.add("notranslate");
      }
      markIconElementsAsNoTranslate(node);
    });
  });
});

observer.observe(document.documentElement, { childList: true, subtree: true });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
