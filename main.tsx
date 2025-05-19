/**
 * Entry point for the React application.
 * Renders the root React component inside a StrictMode wrapper.
 * 
 * Key Responsibilities:
 * - Mounts the app to the DOM element with id "root"
 * - Enables React StrictMode for development checks
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

// Create a root React rendering container attached to the 'root' DOM element
// The non-null assertion (!) is safe here because index.html guarantees this element exists
const root = ReactDOM.createRoot(document.getElementById("root")!);

// Render the application wrapped in StrictMode
root.render(
  <React.StrictMode>
    {/* 
      StrictMode enables additional React development checks for:
      - Identifying unsafe lifecycles
      - Warning about legacy string ref API usage
      - Detecting unexpected side effects
    */}
    <App />
  </React.StrictMode>
);
