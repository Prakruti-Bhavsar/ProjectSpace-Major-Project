import { useState } from "react";
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import Main from '../ui/main';
import Content from '../ui/content';
import Profile from '../components/profile/profile';
import Stats from '../components/Stats/Stats';
import Majorproject from "../components/Majorproject/Majorproject";


const Home = () => {
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
            <Stats/>
            <div className="flex flex-col gap-9 lg:flex-row">
              <Majorproject/>
            </div>
          </Content>
          <Profile darkMode={darkMode}/>
        </Main>
      </div>
  );
};

export default Home;