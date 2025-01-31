import React, { useState } from "react";
import BannerPng from "../../assets/education.png";
import { MdNotificationsActive, MdOutlineAccessTime } from "react-icons/md";
import { FaBookReader } from "react-icons/fa";
import { motion } from "framer-motion";
import { FiPlus, FiMinus } from "react-icons/fi";

const FadeUp = (delay) => ({
  initial: {
    opacity: 0,
    y: 50,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      duration: 0.5,
      delay: delay,
      ease: "easeInOut",
    },
  },
});

const Banner = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const handleToggle = (index) => {
    setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  const items = [
    {
      icon: <FaBookReader className="text-2xl" />,
      title: "Task Prioritization",
      description: "Easily prioritize tasks to focus on what matters most, ensuring deadlines are met without stress.",
    },
    {
      icon: <MdNotificationsActive className="text-2xl" />,
      title: "Notifications & Reminders",
      description: "Stay on top of your tasks with timely notifications and reminders for upcoming deadlines and meetings.",
    },
    {
      icon: <MdOutlineAccessTime className="text-2xl" />,
      title: "Analytics & Reporting",
      description: "Gain insights into project performance with detailed analytics and reports to help you improve future projects.",
    },
  ];

  return (
    <section>
      <div className="container py-14 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-8 space-y-6 md:space-y-0">
        {/* Banner Image */}
        <div className="flex justify-center items-center">
          <motion.img
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            src={BannerPng}
            alt=""
            className="w-[350px] md:max-w-[450px] object-cover drop-shadow"
          />
        </div>

        {/* Banner Text */}
        <div className="flex flex-col justify-center">
          <div className="text-center md:text-left space-y-12">
            <motion.h1
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold !leading-snug"
            >
              Unlock Your Project's Potential with These Powerful Features!
            </motion.h1>
            <div className="flex flex-col gap-6">
              {items.map((item, index) => (
                <motion.div
                  key={index}
                  variants={FadeUp(0.2 + index * 0.2)}
                  initial="initial"
                  whileInView={"animate"}
                  viewport={{ once: true }}
                  className="flex flex-col bg-[#f4f4f4] rounded-2xl hover:bg-white duration-300 hover:shadow-2xl p-6"
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => handleToggle(index)}
                  >
                    <div className="flex items-center gap-4">
                      {item.icon}
                      <p className="text-lg font-medium">{item.title}</p>
                    </div>
                    {activeIndex === index ? (
                      <FiMinus className="text-xl" />
                    ) : (
                      <FiPlus className="text-xl" />
                    )}
                  </div>
                  {activeIndex === index && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 text-1xl font-bold text-blue-700"
                    >
                      {item.description}
                    </motion.p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
