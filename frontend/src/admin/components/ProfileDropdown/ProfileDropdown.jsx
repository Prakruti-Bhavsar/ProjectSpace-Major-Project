import React from "react";

const ProfileDropdown = () => {
  return (
    <div className="absolute right-0 mt-56 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-2">
      <a
        href="#profile"
        className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
      >
        Profile
      </a>
      <a
        href="#settings"
        className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
      >
        Settings
      </a>
      <a
        href="#logout"
        className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
      >
        Logout
      </a>
    </div>
  );
};

export default ProfileDropdown;
