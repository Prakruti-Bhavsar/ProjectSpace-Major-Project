import {useState} from 'react'
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import Main from '../ui/main';
import Content from '../ui/content';
import Calendar from '../components/Schedule/Calendar';

const Sc = () => {
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
            <Calendar/>
          </Content>
        </Main>
    </div>
  )
}

export default Sc