import React, { useState } from 'react';
import { IoMdMenu, IoMdClose } from "react-icons/io";
import { MdDashboard } from "react-icons/md";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

const NavbarMenu = [
    {
        id: 1,
        title: "Home",
        path: "/",
    },
    // {
    //     id: 2,
    //     title: "Services",
    //     path: "#",
    // },
    // {
    //     id: 3,
    //     title: "About Us",
    //     path: "#",
    // },
    // {
    //     id: 4,
    //     title: "Contact Us",
    //     path: "#",
    // },
];

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate(); // Hook for navigation

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow-md backdrop-blur-md bg-opacity-90">
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="container py-6 flex justify-between items-center"
            >
                {/* Logo section with Dashboard Icon */}
                <div className="flex items-center gap-2">
                    <MdDashboard className="text-3xl text-[#fba02a]" />
                    <h1 className='font-bold text-3xl text-black tracking-wide'>ProjectSpace</h1>
                </div>

                {/* Desktop Menu section */}
                <div className='hidden lg:block'>
                    <ul className='flex items-center gap-5'>
                        {/* {NavbarMenu.map((menu) => (
                            <li key={menu.id}>
                                <Link
                                    to={menu.path}
                                    className="inline-block py-2 px-5 text-gray-800 hover:text-blue-700 relative group transition duration-300"
                                >
                                    <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-blue-700 scale-x-0 group-hover:scale-x-100 transition-transform origin-center"></span>
                                    {menu.title}
                                </Link>
                            </li>
                        ))} */}
                        <button
                            className="primary-btn hover:shadow-lg transform hover:-translate-y-1 transition duration-300"
                            onClick={() => navigate("/login")} // Navigate to login
                        >
                            Sign In
                        </button>
                    </ul>
                </div>

                {/* Mobile Hamburger Menu Section */}
                <div className="lg:hidden relative">
                    {isMobileMenuOpen ? (
                        <IoMdClose
                            className="text-4xl cursor-pointer text-blue-700"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    ) : (
                        <IoMdMenu
                            className="text-4xl cursor-pointer text-blue-700"
                            onClick={() => setIsMobileMenuOpen(true)}
                        />
                    )}

                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden"
                        >
                            <ul className="flex flex-col gap-2 p-4">
                                {NavbarMenu.map((menu) => (
                                    <li key={menu.id}>
                                        <Link
                                            to={menu.path}
                                            className="block py-2 px-4 text-gray-800 hover:text-blue-700 hover:bg-gray-100 rounded-md transition"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {menu.title}
                                        </Link>
                                    </li>
                                ))}
                                <button
                                    className="primary-btn w-full py-2 mt-2"
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        navigate("/login");
                                    }}
                                >
                                    Sign In
                                </button>
                            </ul>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </nav>
    );
};

export default Navbar;
