import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import Services from "./components/Services/Services";
import Banner from "./components/Banner/Banner";
import Footer from "./components/Footer/Footer";
import Login from "./components/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Sidebar from "./components/Sidebar/Sidebar";
import Header from "./components/Header/Header";
import ReviewAssessment from "./components/ReviewAssessment/ReviewAssessment";
import ContentDetail from "./components/ContentDetail/ContentDetail";
import EditBtPage from "./components/EditBtPage/EditBtPage"; // Import the EditPage component
import HomePage from "./components/HomePage/HomePage";
import Department from "./components/Department/Department";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <Router>
      <main
        className={`overflow-x-hidden ${
          isDarkMode ? "bg-dark" : "bg-light"
        } text-${isDarkMode ? "light" : "dark"}`}
      >
        <Routes>
          {/* Landing/Home Page */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Hero />
                <Services />
                <Banner />
                <Footer />
              </>
            }
          />

          {/* Login Page */}
          <Route
            path="/login"
            element={
              <>
                <Navbar />
                <Login />
              </>
            }
          />

          {/* Assessment Page */}
          <Route
            path="/assessment"
            element={
              <div className="flex h-screen">
                {/* Sidebar */}
                <Sidebar isDarkMode={isDarkMode} />

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <Header
                    onToggleDarkMode={toggleDarkMode}
                    isDarkMode={isDarkMode}
                  />

                  {/* Dashboard Content */}
                  <main className="p-6">
                    <ReviewAssessment />
                  </main>
                </div>
              </div>
            }
          />

          {/* Content Detail Page */}
          <Route
            path="/content-detail/:year/:event"
            element={
              <div className="flex h-screen">
                {/* Sidebar */}
                <Sidebar isDarkMode={isDarkMode} />

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <Header
                    onToggleDarkMode={toggleDarkMode}
                    isDarkMode={isDarkMode}
                  />

                  {/* Content Detail */}
                  <main className="p-6">
                    <ContentDetail isDarkMode={isDarkMode} />
                  </main>
                </div>
              </div>
            }
          />

          {/* Edit Page */}
          <Route
            path="/edit/:id"
            element={
              <div className="flex h-screen">
                {/* Sidebar */}
                <Sidebar isDarkMode={isDarkMode} />

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <Header
                    onToggleDarkMode={toggleDarkMode}
                    isDarkMode={isDarkMode}
                  />

                  {/* Edit Page Content */}
                  <main className="p-6">
                    <EditBtPage isDarkMode={isDarkMode} />
                  </main>
                </div>
              </div>
            }
          />
          
         {/* Home Page */}
          <Route
            path="/home"
            element={
              <div className="flex h-screen">
                {/* Sidebar */}
                <Sidebar isDarkMode={isDarkMode} />

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <Header
                    onToggleDarkMode={toggleDarkMode}
                    isDarkMode={isDarkMode}
                  />

                  <main className="p-6">
                  <HomePage isDarkMode={isDarkMode} />

                  </main>

                
                </div>
              </div>
            }
          />

          {/* Department Page */}
          <Route
            path="/department"
            element={
              <div className="flex h-screen">
                {/* Sidebar */}
                <Sidebar isDarkMode={isDarkMode} />

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <Header
                    onToggleDarkMode={toggleDarkMode}
                    isDarkMode={isDarkMode}
                  />

                  <main className="p-6">
                  <Department isDarkMode={isDarkMode} />

                  </main>

                
                </div>
              </div>
            }
          />      

        </Routes>
      </main>
    </Router>
  );
}
