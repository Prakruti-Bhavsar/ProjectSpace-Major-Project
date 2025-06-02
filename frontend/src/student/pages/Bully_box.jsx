import { useState, useEffect } from "react";
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import Bully_detail from '../components/Miniproject_details/Bully_detail';
import Main from '../ui/main';
import Content from '../ui/content';
import useInactivityLogout from '../../useInactivityLogout'
import Footer from '../components/Footer/Footer'

const Bully_box = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useInactivityLogout();
  const [isMobile, setIsMobile] = useState(false);
  const toggleDarkMode=()=>{
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkIsMobile(); // Initial check
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const toogleSidebar = () =>{
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <div className={`${darkMode && "dark"} font-quickSand`}>
    <Header toggleDarkMode={toggleDarkMode} 
        darkMode={darkMode} 
        toggLeSidebar={toogleSidebar} />
        <Sidebar isSidebarOpen={isSidebarOpen}/>
        <Main>
          <Content>
            <Bully_detail isSidebarOpen={isSidebarOpen} isMobile={isMobile}/>
          </Content>
        </Main>
        <Footer isSidebarOpen={isSidebarOpen} isMobile={isMobile}/>
    </div>
    

    
  )
}

export default Bully_box;