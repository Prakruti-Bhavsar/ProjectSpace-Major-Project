import React from "react";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="py-10 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="container text-center"
      >
        <p className="text-md max-w-4xl mx-auto px-1 text-gray-800">
          Developed by{" "}
          <span className="text-pink-600 font-semibold">Prakruti Bhavsar</span>,{" "}
          <span className="text-blue-600 font-semibold">Nimisha Idekar</span>,{" "}
          <span className="text-purple-600 font-semibold">Akanksha Bhoir</span>, and{" "}
          <span className="text-teal-600 font-semibold">Payal Gupta</span> under the guidance of{" "}
          <span className="text-rose-600 font-semibold">Prof. Vishal S. Badgujar</span> and{" "}
          <span className="text-indigo-600 font-semibold">Prof. Seema Jadhav</span>.
        </p>
      </motion.div>
    </footer>
  );
};

export default Footer;

