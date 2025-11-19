import React from "react";
import { NavLink, Outlet } from "react-router-dom";

// Updated style function for better visual feedback
const getTabStyle = ({ isActive }) => {
  return isActive
    ? "pb-3 px-1 text-lg font-semibold text-indigo-600 border-b-4 border-indigo-600"
    : "pb-3 px-1 text-lg font-medium text-gray-500 hover:text-gray-700 border-b-4 border-transparent";
};

const Mindfulness = () => {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Mindfulness</h2>

      {/* Tab Navigation with new Stats tab */}
      <div className="flex space-x-8 border-b border-gray-200">
        <NavLink to="sessions" className={getTabStyle}>
          Mood Sessions
        </NavLink>
        <NavLink to="meditation" className={getTabStyle}>
          Meditation Library
        </NavLink>
        <NavLink to="stats" className={getTabStyle}>
          My Stats
        </NavLink>
      </div>

      {/* Renders the active child route (Sessions, Meditation, or Stats) */}
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
};

export default Mindfulness;
