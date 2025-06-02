import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing_Page from "./admin/pages/LandingPage";
import Login_Page from "./admin/pages/Login_Page";
import Home_Page from "./admin/pages/Home_Page";
import ProtectedRoutes from "./ProtectedRoutes";
import Assessment from "./admin/pages/Assessment";
import Assessment_Detail_Page from "./admin/pages/Assessment_Detail_Page";
import Assessment_Edit_Page from "./admin/pages/Assessment_Edit_Page";
import Department_Page from "./admin/pages/Department";
import Project_Page from "./admin/pages/Project_Page";
import ProjectDetail_Page from "./admin/pages/ProjectDetail_Page";
import Semester_Page from "./admin/pages/Semester_Page";
import Management_Page from "./admin/pages/Management_Page";
import Repository_Page from "./admin/pages/Repository_Page";

import Home from "./student/pages/Home";
import Bully_box from "./student/pages/Bully_box";
import Major_project from "./student/pages/Major_project";
import Sc from "./student/pages/Sc";
import SToday from "./student/pages/SToday";
import Resource from "./student/pages/Resource";
import Logout from "./student/pages/Logout";
import SNotification from "./student/pages/SNotification";
import SProfile from "./student/pages/SProfile";
import SHealthmeta from "./student/pages/SHealthmeta";
import Sproject_pro from "./student/pages/Sproject_pro";
import SBMI from "./student/pages/SBMI";
import Major_new_page from "./student/pages/major_new_page";
import Setting_Page from "./admin/pages/Setting_Page";

export default function App() {
   const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
   setIsDarkMode(!isDarkMode);
  };

  return(
    <Router>
      <main
        className={`overflow-x-hidden ${
          isDarkMode ? "bg-dark" : "bg-light"
        } text-${isDarkMode ? "light" : "dark"}`}
      >
        <Routes>
          <Route
              path="/"
              element={
                <>
                  <Landing_Page/>
                </>
              }
            />

            <Route
              path="/login"
              element={
                <>
                  <Login_Page/>
                </>
              }
            />

            <Route element={<ProtectedRoutes />}>
              <Route path="/home" element={<Home_Page/>} />
              <Route path="/assessment" element={<Assessment/>} />
              <Route path="/assessment/:year/:event" element={<Assessment_Detail_Page/>}/>
              <Route path="/assessment/edit/:event" element={<Assessment_Edit_Page/>}/>
              <Route path="/department" element={<Department_Page/>}/>
              <Route path="/department/:category/:year/Semester" element={<Semester_Page/>}/>
              <Route path="/department/:category/:year/:semester/:div/projects" element={<Project_Page/>}/>
              <Route path="/department/:category/:year/:semester/:project/view" element={<ProjectDetail_Page/>}/>
              <Route path="/management" element={<Management_Page/>}/>
              <Route path="/repository" element={<Repository_Page/>}/>
              <Route path="/settings" element={<Setting_Page/>}/>
            </Route>

            <Route element={<ProtectedRoutes />}>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/project-details/:id" element={<Bully_box />} />
              <Route path="/major_project/:id" element={<Major_project />} />
              <Route path="/major_project_new" element={<Major_new_page />} />
              {/* <Route path="/schedule" element={<Sc />} /> 
              <Route path="/today" element={<SToday />} />  */}
              <Route path="/resource" element={<Resource />} />  
              <Route path="/logout"  element={<Logout />} />
              {/* <Route path="/notification"  element={<SNotification />} />   */}
              <Route path="/profile"  element={<SProfile />} />   
              {/* <Route path="/health-meta"  element={<SHealthmeta />} />   
              <Route path="/project-pro"  element={<Sproject_pro />} />   
              <Route path="/bmi-calculator"  element={<SBMI />} /> */}
            </Route>
        </Routes>
      </main>
    </Router>
  );
}