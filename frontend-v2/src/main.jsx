import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, unstableSetRender } from 'antd';
import { Toaster } from 'sonner';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/Common/ErrorBoundary';

import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import { AuthProvider } from './context/AuthContext';

// Keep Ant Design's static dialogs compatible with React 19.
unstableSetRender((node, container) => {
  container._reactRoot ||= createRoot(container);
  const root = container._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster position="top-right" richColors closeButton duration={3000} />
    <ErrorBoundary area="The application" variant="root">
      <Provider store={store}>
        <BrowserRouter>
          <AuthProvider>
            {/* popups (modals, drawers, dropdowns) above the fixed sidebar (z-index 1001) */}
            <ConfigProvider theme={{ token: { zIndexPopupBase: 1100 } }}>
              <App />
            </ConfigProvider>
          </AuthProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);
