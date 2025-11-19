import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-between bg-gradient-to-br from-indigo-100 via-white to-blue-100 px-8 md:px-16 py-10">
      {/* LEFT: Text Section */}
      <motion.div
        className="flex-1 max-w-lg text-center md:text-left space-y-6"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-5xl md:text-6xl font-extrabold text-indigo-700 leading-tight">
          ArogyaManas
        </h1>

        <p className="text-gray-700 text-lg md:text-xl">
          Your digital space for{" "}
          <span className="font-semibold text-indigo-600">mental wellness</span>{" "}
          and{" "}
          <span className="font-semibold text-blue-600">emotional support</span>{" "}
          in higher education.
        </p>

        <Link to="/arogyamanas/login">
          <motion.button
            className="mt-6 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started →
          </motion.button>
        </Link>
      </motion.div>

      {/* RIGHT: Illustration */}
      <motion.div
        className="flex-1 flex justify-center mt-10 md:mt-0"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 0.2 }}
      >
        <img
          src="/assets/images/landingPage.png"
          alt="ArogyaManas illustration"
          className="w-4/5 md:w-3/4 lg:w-2/3 drop-shadow-xl"
        />
      </motion.div>

      {/* FOOTER */}
      <footer className="absolute bottom-4 text-gray-500 text-sm text-center w-full">
        {new Date().getFullYear()} ©{" "}
        <span className="font-semibold text-indigo-600">ArogyaManas</span> |
        Empowering Student Well-being
      </footer>
    </div>
  );
};

export default LandingPage;
