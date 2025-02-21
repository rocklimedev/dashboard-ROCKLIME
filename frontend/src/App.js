import "./App.css";
import Header from "./components/Common/Header";
import Sidebar from "./components/Common/Sidebar";
import Router from "./router/Router";
import { useLocation } from "react-router-dom";

function App() {
  const location = useLocation();
  const isAuthPage = ["/login", "/signup", "/404"].includes(location.pathname); // Add more auth routes if needed

  return (
    <div className="main-wrapper">
      {!isAuthPage && <Header />}
      {!isAuthPage && <Sidebar />}
      <Router />
    </div>
  );
}

export default App;
