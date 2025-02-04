import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing_Page from "./admin/pages/LandingPage";
import Login_Page from "./admin/pages/Login_Page";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return(
    <Router>
      <main
        className={`overflow-x-hidden ${
          isDarkMode ? "bg-dark" : "bg-light"
        } text-${isDarkMode ? "light" : "dark"}`}
      >
        <Routes>
          <Route
              path="/"
              element={
                <>
                  <Landing_Page/>
                </>
              }
            />

            <Route
              path="/login"
              element={
                <>
                  <Login_Page/>
                </>
              }
            />
        </Routes>
      </main>
    </Router>
  );
}