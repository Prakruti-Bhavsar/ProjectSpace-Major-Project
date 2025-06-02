import {useState} from 'react'
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import Main from '../ui/main';
import Content from '../ui/content';
import Calendar from '../components/Schedule/Calendar';
import Cl_Today from '../components/Schedule/Cl_Today';
import useInactivityLogout from '../../useInactivityLogout'

const SToday = () => {
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
              <Cl_Today/>
          </Content>
        </Main>
    </div>
  )
}

export default SToday