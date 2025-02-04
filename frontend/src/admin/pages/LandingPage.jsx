import React from "react"
import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import Services from "../components/Services/Services";
import Banner from "../components/Banner/Banner";
import Footer from "../components/Footer/Footer";

const Landing_Page = () => {
    return (
        <>
            <Navbar/>
            <Hero/>
            <Services/>
            <Banner/>
            <Footer/>
        </>
    )
}

export default Landing_Page;