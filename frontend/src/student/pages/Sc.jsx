import {useState, useEffect} from 'react'
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import Main from '../ui/main';
import Content from '../ui/content';
import Calendar from '../components/Schedule/Calendar';
import useInactivityLogout from '../../useInactivityLogout'
import Footer from '../components/Footer/Footer';

const Sc = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useInactivityLogout();

  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    // Initial check
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);

    // Cleanup
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
        toggLeSidebar={toogleSidebar} />
      <Sidebar isSidebarOpen={isSidebarOpen} />
      <Main>
        <Content>
          <Calendar isSidebarOpen={isSidebarOpen} isMobile={isMobile} />
        </Content>
      </Main>
      <Footer isSidebarOpen={isSidebarOpen} isMobile={isMobile}/>
    </div>
  )
}

export default Sc