
import Header from "./components/Common/Header";
import Router from "./router/Router";
import { useLocation } from "react-router-dom";
import Sidebar from "./components/Common/SidebarNew";
function App() {
  const location = useLocation();
  const isAuthPage = ["/login", "/signup", "/404", "/forgot-password"].includes(location.pathname); // Add more auth routes if needed

  return (
    <div className="main-wrapper">
      {!isAuthPage && <Header />}
      {!isAuthPage && <Sidebar />}
      <Router />
    </div>
  );
}

export default App;
