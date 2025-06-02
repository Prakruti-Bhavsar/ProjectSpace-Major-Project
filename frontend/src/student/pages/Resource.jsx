import { useState, useEffect } from "react";
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import Main from '../ui/main';
import Content from '../ui/content';
import FilterProjects from "../components/Resource_detail/FilterProject";
import useInactivityLogout from '../../useInactivityLogout'
import Footer from "../components/Footer/Footer";

const Resource = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    useInactivityLogout();
    const [isMobile, setIsMobile] = useState(false);

    const toggleDarkMode=()=>{
      setDarkMode(!darkMode);
    };
  
    const toogleSidebar = () =>{
      setIsSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return (
    <div className={`${darkMode && "dark"} font-quickSand`}>
        <Header toggleDarkMode={toggleDarkMode} 
        darkMode={darkMode} 
        toggLeSidebar={toogleSidebar}/>
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <Main>
          <Content>
            <FilterProjects isSidebarOpen={isSidebarOpen} isMobile={isMobile} />
          </Content>
        </Main>
        <Footer isSidebarOpen={isSidebarOpen} isMobile={isMobile}/>
    </div>
  )
}

export default Resource