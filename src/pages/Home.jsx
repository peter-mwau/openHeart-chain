import React from "react";
import VantaGlobeBG from "../components/VantaJS";
import { useDarkMode } from "../contexts/themeContext";

function Home() {
  const { darkMode } = useDarkMode();

  return (
    <>
      <VantaGlobeBG darkMode={darkMode}>
        <div>
          <p>Welcome to the Home Page!</p>
        </div>
      </VantaGlobeBG>
    </>
  );
}

export default Home;
