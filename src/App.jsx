import "./App.css";
// import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CampaignDetails from "./pages/CampaignDetails.jsx";
import { useState } from "react";
import { useDarkMode } from "./contexts/themeContext.jsx";
import VantaGlobeBG from "./components/VantaJS.jsx";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const { darkMode } = useDarkMode();

  const renderPage = () => {
    switch (currentPage) {
      case "campaignDetails":
        return <CampaignDetails setCurrentPage={setCurrentPage} />;
      case "home":
      default:
        return <Home setCurrentPage={setCurrentPage} />;
    }
  };
  return (
    <VantaGlobeBG darkMode={darkMode}>
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {/* Main Content */}
      <div className="bg-transparent relative z-10">{renderPage()}</div>
    </VantaGlobeBG>
  );
}

export default App;
