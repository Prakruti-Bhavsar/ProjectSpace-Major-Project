import { FaMoon, FaSun } from "react-icons/fa";
import { HiOutlineMenuAlt2 } from "react-icons/hi";
import { MdSpaceDashboard } from "react-icons/md";
import { useState, useEffect } from "react";
import AxiosInstance from "../../../AxiosInstance";
import userLogo from "../../assets/user01.png"

const Header = ({ darkMode, toggleDarkMode,
toggLeSidebar }) => {

    const [username, setUsername] = useState("");

  useEffect(() => {
    AxiosInstance.get("/user/user-info/")
      .then((response) => {
        setUsername(response.data.username);
      })
      .catch(() => {
        setUsername("Guest");
      });
  }, []);
  return (
  <nav className="fixed top-0 z-50 w-full bg-[#ffcc82]
  border-b border-gray-200 
  dark:bg-gray-800
  dark:border-gray-700">
    <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center justify-start rtl:justify-end">

                <button 
                 className="inline-flex items-center
                 p-2 text-sm text-gray-500 rounded-lg 
                 sm:hidden hover:bg-gray-100 
                 focus:outline-none focus:ring-2
                 focus:ring-gray-200 dark:text-gray-400
                 dark:hover:bg-gray-700
                 dark:focus:ring-gray-600"
                 onClick={toggLeSidebar}
                >
                    <HiOutlineMenuAlt2  className="text-2xl"/>
                </button>
                <a className="flex ms-2 md:me-24">
                    <MdSpaceDashboard className="h-8 me-3
                    text-3xl text-[#fba02a]"/>
                    <span className="self-center text-2xl font-bold sm:text-3xl whitespace-nowrap
                    dark:text-white text-white">ProjectSpace
                    </span>
                </a>
                
            </div>
            {/* <button className="dark:bg-slate-50 
            dark:text-slate-700 rounded-full p-2 bg-white" onClick={toggleDarkMode}>
                {darkMode ? <FaSun color="#fba02a"/> : <FaMoon color="#fba02a"/>}
            </button> */}
            {/* <div>
            <p className={`text-sm font-bold text-[#121138]`}>
              {username}
            </p>
          </div> */}
          <div className="flex gap-3 items-center pr-2 pl-2 pt-1 pb-1 -mt-3 -mb-3">
                  <img src={userLogo} alt="user image" className="w-8 h-8 rounded-full"/>
                  <div >
                      {/* <h3 className="font-semibold text-xl text-white">Payal Gupta</h3> */}
                      <p className="font-bold font-sm text-black">{username}</p>
                  </div>
              </div>
        </div>
    </div>

  </nav>
  );
};

export default Header;

