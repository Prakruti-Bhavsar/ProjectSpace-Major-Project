import { useState, useEffect } from "react";
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import Main from '../ui/main';
import Content from '../ui/content';
import Major1_detail from "../components/Major_content/Major1_detail";
import useInactivityLogout from '../../useInactivityLogout'
import Footer from "../components/Footer/Footer";

const Major_project = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useInactivityLogout();
  const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkIsMobile(); // Initial check
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const toggleDarkMode=()=>{
    setDarkMode(!darkMode);
  };

  const toogleSidebar = () =>{
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <div className={`${darkMode && "dark"} font-quickSand`}>
    <Header toggleDarkMode={toggleDarkMode} 
        darkMode={darkMode} 
        toggLeSidebar={toogleSidebar}/>
    <Sidebar isSidebarOpen={isSidebarOpen} />
    <Main>
      <Content>
        <Major1_detail isSidebarOpen={isSidebarOpen} isMobile={isMobile} />
      </Content>
    </Main>
    <Footer isSidebarOpen={isSidebarOpen} isMobile={isMobile}/>
    </div>
  )
}

export default Major_project