import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { unstableSetRender } from "antd";
import "./index.css";
import App from "./App.jsx";

import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store";
import { AuthProvider } from "./context/AuthContext";

// antd v5 static APIs (message, notification, Modal.confirm) render through the
// legacy ReactDOM.render, which React 19 removed, so their toasts silently never
// appear. Route them through createRoot instead (antd's documented React 19 fix).
unstableSetRender((node, container) => {
  container._reactRoot ||= createRoot(container);
  const root = container._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
