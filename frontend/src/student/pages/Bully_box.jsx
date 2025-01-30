import { useState } from "react";
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import Bully_detail from '../components/Miniproject_details/Bully_detail';
import Main from '../ui/main';
import Content from '../ui/content';


const Bully_box = () => {
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
        toggLeSidebar={toogleSidebar} />
        <Sidebar isSidebarOpen={isSidebarOpen}/>
        <Main>
          <Content>
            <Bully_detail/>
          </Content>
        </Main>
        
        
    </div>
    

    
  )
}

export default Bully_box;