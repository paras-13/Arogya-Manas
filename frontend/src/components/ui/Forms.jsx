import { motion } from "framer-motion";

export const FormLayout = ({
  heading,
  subHeading,
  inputs,
  handleSubmit,
  submitText = "Submit",
  navType,
  navText,
  navLink,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 to-white p-6">
      <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl w-full">
        {/* Left Section */}
        <div className="hidden md:flex md:w-1/2 bg-linear-to-br from-indigo-600 to-purple-600 text-white flex-col justify-center items-center p-10 relative">
          <motion.img
            src="/assets/images/authIcon.png"
            alt="Wellness Illustration"
            className="w-2/3 mb-6 rounded-4xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
          />
          <motion.h2
            className="text-2xl font-bold text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Empowering Students’ Mental Wellbeing
          </motion.h2>
          <p className="text-center text-indigo-100 mt-2 text-sm">
            Join our initiative for better mental health and academic balance.
          </p>
          <div className="absolute bottom-4 text-xs text-indigo-200">
            © 2025 ArogyaManas Platform
          </div>
        </div>

        {/* Right Section (Form) */}
        <div className="w-full md:w-1/2 p-10 space-y-6">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
              {heading}
            </h2>
            {subHeading && (
              <p className="mt-2 text-center text-sm text-gray-600">
                {subHeading}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-4">{inputs}</div>

            <button
              type="submit"
              className="w-full py-2 px-4 text-sm font-medium rounded-md 
                         text-white bg-indigo-600 hover:bg-indigo-700 
                         focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 
                         transition duration-150 ease-in-out"
            >
              {submitText}
            </button>
          </form>

          {navText && (
            <h4 className="text-center text-blue-600">
              {navText}{" "}
              <a
                href={navLink}
                className="text-slate-600 font-bold hover:underline"
              >
                {navType}
              </a>
            </h4>
          )}
        </div>
      </div>
    </div>
  );
};

export const FormInput = ({
  label,
  type,
  name,
  placeholder,
  value,
  onChange,
}) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      type={type}
      name={name}
      id={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                 placeholder-gray-400 focus:outline-none 
                 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
    />
  </div>
);

export const RoleSelector = ({ label, name, roles, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <button
          key={role.value}
          type="button"
          onClick={() => onChange({ target: { name, value: role.value } })}
          className={`px-4 py-2 rounded-full text-sm font-medium border 
          transition-all duration-150 ${
            value === role.value
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-indigo-50"
          }`}
        >
          {role.label}
        </button>
      ))}
    </div>
  </div>
);
