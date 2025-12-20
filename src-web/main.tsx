import React from "react";
import ReactDOM from "react-dom/client";

import { Providers } from "./components/providers";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Providers />
  </React.StrictMode>,
);
