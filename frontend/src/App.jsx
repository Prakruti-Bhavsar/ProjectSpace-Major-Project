import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Bully_box from "./pages/Bully_box";
import Major_project from "./pages/Major_project";
import Sc from "./pages/Sc";
import Resource from "./pages/Resource";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bully-box" element={<Bully_box />} />
        <Route path="/major_project" element={<Major_project />} />
        <Route path="/schedule" element={<Sc />} /> 
        <Route path="/resource" element={<Resource />} />               
      </Routes>
    </BrowserRouter>
  );
};

export default App;
