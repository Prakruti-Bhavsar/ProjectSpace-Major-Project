import React, { useState } from "react"
import Sidebar from '../components/Sidebar/Sidebar'
import Header from '../components/Header/Header'
import Department from '../components/Department/Department'

const Department_Page = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <main
        className={`overflow-x-hidden ${
          isDarkMode ? "bg-dark" : "bg-light"
        } text-${isDarkMode ? "light" : "dark"}`}
       >
            <div className="flex h-screen">
                {/* Sidebar */}
                <Sidebar isDarkMode={isDarkMode} />

                {/* Main Content */}
                <div className="ml-64 flex-1 flex flex-col bg-inherit">
                  {/* Header */}
                  <Header
                    onToggleDarkMode={toggleDarkMode}
                    isDarkMode={isDarkMode}
                  />

                  <main className="p-6 flex-1">
                  <Department isDarkMode={isDarkMode} />

                  </main>

                
                </div>
            </div>
        </main>
    )
}

export default Department_Page;