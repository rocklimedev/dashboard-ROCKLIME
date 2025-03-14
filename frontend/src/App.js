import Header from "./components/Common/Header";
import Router from "./router/Router";
import { useLocation } from "react-router-dom";
import Sidebar from "./components/Common/SidebarNew";
import Footer from "./components/Common/Footer";
import { useState } from "react";
function App() {
  const location = useLocation();
  const isAuthPage = [
    "/login",
    "/signup",
    "/404",
    "/forgot-password",
    "/under-maintainance",
    "/coming-soon",
  ].includes(location.pathname); // Add more auth routes if needed
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const isPOSPage = location.pathname === "/pos"; // Check if route is /pos
  const token = localStorage.getItem("token");
  console.log(token);
  return (
    <div className="pos-page">
      <div className="main-wrapper">
        {!isAuthPage && <Header toggleSidebar={setSidebarOpen} />}
        {!isAuthPage && !isPOSPage && (
          <Sidebar isSidebarOpen={isSidebarOpen} />
        )}{" "}
        {/* Remove Sidebar on /pos */}
        <Router />
        <Footer />
      </div>
    </div>
  );
}

export default App;
