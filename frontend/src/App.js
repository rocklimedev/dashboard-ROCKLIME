import Header from "./components/Common/Header";
import Router from "./router/Router";
import { useLocation } from "react-router-dom";
import Sidebar from "./components/Common/SidebarNew";
import Footer from "./components/Common/Footer";
function App() {
  const location = useLocation();
  const isAuthPage = ["/login", "/signup", "/404", "/forgot-password"].includes(
    location.pathname
  ); // Add more auth routes if needed

  return (
    <div className="main-wrapper">
      {!isAuthPage && <Header />}
      {!isAuthPage && <Sidebar />}
      <Router />
   <Footer/>
    </div>
  );
}

export default App;
