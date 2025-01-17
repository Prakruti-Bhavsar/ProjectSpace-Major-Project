import { useState } from "react";
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import Main from '../ui/main';
import Content from '../ui/content';
import Major1_detail from "../components/Major_content/Major1_detail";

const Major_project = () => {
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
        <Major1_detail/>
      </Content>
    </Main>
    </div>
  )
}

export default Major_project