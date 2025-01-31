import React from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-light dark:bg-dark">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="p-4">
          <h1 className="text-2xl font-bold text-dark dark:text-light">
            Welcome to the Dashboard!
          </h1>
          <p className="mt-2 text-dark2 dark:text-gray-400">
            Here is where your main dashboard content will go.
          </p>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
