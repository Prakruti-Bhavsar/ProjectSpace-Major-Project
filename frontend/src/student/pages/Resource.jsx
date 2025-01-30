import { useState } from "react";
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import Main from '../ui/main';
import Content from '../ui/content';
import FilterProjects from "../components/Resource_detail/FilterProject";
const Resource = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
            <FilterProjects/>
          </Content>
        </Main>
    </div>
  )
}

export default Resource