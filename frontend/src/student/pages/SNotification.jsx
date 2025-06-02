import { useState } from "react";
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import Smsg from '../components/Snot/Smsg';
import Main from '../ui/main';
import Content from '../ui/content';
import useInactivityLogout from '../../useInactivityLogout'

const SNotification = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useInactivityLogout();
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
        <Sidebar isSidebarOpen={isSidebarOpen}/>
        <Main>
          <Content>
            <Smsg/>
          </Content>
        </Main>
    </div>

  )
}

export default SNotification