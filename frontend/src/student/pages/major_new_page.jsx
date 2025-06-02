import { useState } from "react";
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import Main from '../ui/main';
import Content from '../ui/content';
import Major_new from "../components/Major_content/major_new";
import useInactivityLogout from '../../useInactivityLogout'

const Major_new_page = () => {
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
        toggLeSidebar={toogleSidebar}/>
    <Sidebar isSidebarOpen={isSidebarOpen} />
    <Main>
      <Content>
        <Major_new/>
      </Content>
    </Main>
    </div>
  )
}

export default Major_new_page;