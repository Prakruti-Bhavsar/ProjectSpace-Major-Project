import React from 'react';
import { links } from "../../constants/index";
import LinkItem from "./LinkItem";
import { Link, useNavigate } from "react-router-dom";
import { IoIosLogOut} from "react-icons/io";
import AxiosInstance from '../../../AxiosInstance';

const Sidebar = ({ isSidebarOpen }) => {
  const navigate = useNavigate();
  const logoutUser = () =>{
    AxiosInstance.post(`logout/`,{
    })
    .then( () => {
      localStorage.removeItem("Token")
      navigate(`/`)
    }

    )
  }
  return(
  <aside className={`fixed top-0 left-0 z-40 w-64 
    h-screen pt-20 bg-[#121138] border-r border-gray-200 
    sm:translate-x-0 dark:bg-gray-800
     dark:border-gray-700 transition-transform ${isSidebarOpen ? "translate-x-0": 
      "-translate-x-full"
     }` }>

      <div className="h-full px-3 pb-4 overflow-y-auto">
        <ul className="space-y-2 font-semibold text-lg">
          {
            links.map((link, index)=>(
              <LinkItem key={index} {...link} />
            ))
          }
          <Link
              // to={href} // Use 'to' instead of 'href'
              onClick={logoutUser}
              className="flex items-center p-2 text-gray-900 
              rounded-lg dark:text-white 
              hover:bg-[#4B49AC]
              dark:hover:bg-gray-700 hover:text-[#ffffff] transition duration-300"
            >
              <IoIosLogOut className="mr-3 text-white" />
              <span className="flex-1 me-3 text-white">Logout</span>
          </Link>
        </ul>

      </div>
  </aside>
  
  );
  
};

export default Sidebar;