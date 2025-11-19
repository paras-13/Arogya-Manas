// src/components/layout/MainLayout.jsx
import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-100 via-white to-blue-100">
      {/* Soft decorative background glows */}
      <div className="absolute top-[-80px] left-[-80px] h-60 w-60 bg-indigo-300/40 blur-3xl rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-60px] right-[-60px] h-72 w-72 bg-blue-300/40 blur-3xl rounded-full animate-pulse delay-150"></div>

      {/* Main Layout */}
      <div className="relative flex flex-col h-full backdrop-blur-xl">
        {/* NAVBAR */}
        <div className="shadow-md bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-20">
          <Navbar />
        </div>

        {/* BODY: Sidebar + Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* SIDEBAR */}
          <div className="shadow-lg bg-white/70 backdrop-blur-xl border-r border-gray-200/50 w-64 hidden md:block">
            <Sidebar />
          </div>

          {/* MAIN CONTENT AREA */}
          <main
            className="
              flex-1 
              overflow-y-auto 
              px-6 py-6 
              bg-white/60 
              backdrop-blur-sm 
              rounded-l-3xl 
              shadow-inner
              transition-all
            "
          >
            <div className="max-w-6xl mx-auto animate-fadeIn">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
