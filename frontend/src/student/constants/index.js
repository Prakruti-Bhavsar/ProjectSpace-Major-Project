import {
  IoIosSettings,
  IoIosLogOut,
} from "react-icons/io";
import {
  FaHome,
  FaCalendarAlt,
  FaBuffer,
  FaBell,
  FaChevronRight
} from "react-icons/fa";



export const links = [
  {
    href: "#",
    icon: FaHome,
    text: "Home",
  },
  {
    href: "/schedule",
    icon: FaCalendarAlt,
    text: "Schedule",
    
  },
  {
    href: "/resource",
    icon: FaBuffer,
    text: "Resources",
    
  },
  {
    href: "#",
    icon: FaBell,
    text: "Notification",
    badge: {
      text: "3",
      color: "bg-blue-100 text-blue-800",
      darkColor: "dark:bg-blue-900 dark:text-blue-300",
    },
  },
  {
    href: "#",
    icon: IoIosSettings,
    text: "Settings",
  },
  
  {
    href: "#",
    icon: IoIosLogOut,
    text: "Logout",
  },
];

