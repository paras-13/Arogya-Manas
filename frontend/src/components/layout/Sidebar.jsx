import React, { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiHeart,
  FiActivity,
  FiMessageCircle,
  FiClock,
} from "react-icons/fi";
import { RiFileUserLine } from "react-icons/ri";
import { AuthContext } from "../../store/AuthContext";
import { USER_TYPE } from "../../utils/constants";
import api from "../../api";

const Sidebar = () => {
  const { authState } = useContext(AuthContext);
  const role = authState?.user?.role?.toLowerCase();

  const [isApplied, setIsApplied] = useState(false);
  const [isAccepted, setIsAccepted] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.post("/counselor/application-status/");
        setIsApplied(resp.data.is_applied);
        setIsAccepted(resp.data.is_accepted);
      } catch {
        setIsApplied(false);
        setIsAccepted(0);
      }
    })();
  }, []);

  const navItems = [
    // Student
    {
      path: "dashboard",
      label: "Dashboard",
      icon: <FiHome />,
      role: USER_TYPE.STUDENT,
    },
    {
      path: "mood",
      label: "Mood Tracking",
      icon: <FiHeart />,
      role: USER_TYPE.STUDENT,
    },
    {
      path: "mindfulness",
      label: "Mindfulness",
      icon: <FiActivity />,
      role: USER_TYPE.STUDENT,
    },
    {
      path: "ai_assist",
      label: "AI Assistant",
      icon: <FiMessageCircle />,
      role: USER_TYPE.STUDENT,
    },
    {
      path: "mentor",
      label: "Counselor",
      icon: <RiFileUserLine />,
      role: USER_TYPE.STUDENT,
    },
    {
      path: "appointments",
      label: "My Sessions",
      icon: <FiClock />,
      role: USER_TYPE.STUDENT,
    },

    // Mentor
    {
      path: "counselor",
      label: "Counselor Home",
      icon: <FiHome />,
      role: USER_TYPE.MENTOR,
    },
    {
      path: "counselor-dashboard",
      label: "Dashboard",
      icon: <FiHome />,
      role: USER_TYPE.MENTOR,
    },
    {
      path: "counselor-details",
      label: "Details",
      icon: <FiActivity />,
      role: USER_TYPE.MENTOR,
    },
    {
      path: "availability",
      label: "Availability",
      icon: <FiClock />,
      role: USER_TYPE.MENTOR,
    },
    {
      path: "sessions",
      label: "My Sessions",
      icon: <FiActivity />,
      role: USER_TYPE.MENTOR,
    },
  ];

  const filteredItems = navItems
    .filter((it) => it.role === authState.user.role)
    .filter((it) => {
      if (authState.user.role === USER_TYPE.STUDENT) return true;

      // Mentor rules
      if (!isApplied && isAccepted === 0) return it.path === "counselor";
      if (isApplied && isAccepted === 0) return it.path === "counselor";
      if (isApplied && isAccepted === 1) return true;
      if (isApplied && isAccepted === 2) return it.path === "counselor";

      return false;
    });

  return (
    <div className="w-64 bg-white/60 backdrop-blur-xl border-r border-gray-200/50 shadow-lg h-full p-6 flex flex-col">
      <div className="text-lg font-semibold text-gray-700 mb-6 px-3 tracking-wide">
        Menu
      </div>

      <nav className="space-y-3 flex flex-col">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={`/arogyamanas/${role}/${item.path}`}
            className={({ isActive }) =>
              `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all
              ${
                isActive
                  ? "bg-indigo-100 text-indigo-700 shadow-md scale-[1.02] border border-indigo-200"
                  : "text-gray-700 hover:bg-gray-100 hover:scale-[1.01] hover:shadow-sm"
              }
            `
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
