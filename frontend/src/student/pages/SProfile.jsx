import { useState, useEffect } from "react";
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import Profile from '../components/SProfile/Profile';
import Main from '../ui/main';
import Content from '../ui/content';
import useInactivityLogout from '../../useInactivityLogout'
import Footer from "../components/Footer/Footer";

const SProfile = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useInactivityLogout();

   const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const toggleDarkMode=()=>{
    setDarkMode(!darkMode);
  };

  const toogleSidebar = () =>{
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <div className={`${darkMode && "dark"} font-quickSand min-h-screen flex flex-col`}>
      <Header
        toggleDarkMode={toggleDarkMode}
        darkMode={darkMode}
        toggLeSidebar={toogleSidebar}
      />
      <div className="flex flex-1">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className="flex-1 flex flex-col">
          <Main className="flex-1">
            <Content>
              <Profile isSidebarOpen={isSidebarOpen} isMobile={isMobile} />
            </Content>
          </Main>
        </div>
      </div>
      <Footer isSidebarOpen={isSidebarOpen} isMobile={isMobile}/>
    </div>
  )
}

export default SProfile