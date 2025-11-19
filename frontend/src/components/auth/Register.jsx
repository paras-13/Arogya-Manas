import { useContext, useState } from "react";
import { FormLayout, FormInput, RoleSelector } from "../ui/Forms";
import { AUTH_ACTIONS, USER_TYPE } from "../../utils/constants";
import { toast } from "react-toastify";
import api from "../../api";
import { AuthContext } from "../../store/AuthContext";
import { useNavigate } from "react-router-dom";
const Register = () => {
  const navigate = useNavigate();
  const { authDispatcher } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.warning("Password and Confirm Password are not matching");
      return;
    }
    console.log(formData);
    try {
      const res = await api.post("/accounts/register/", formData);
      authDispatcher({
        type: AUTH_ACTIONS.LOGIN,
        payload: {
          token: res.data.token,
          user: res.data.user,
        },
      });
      toast.success(res.data.message);
      navigate(`/arogyamanas/${res.data.user.role}`);
    } catch (err) {
      toast.error(err.response.data.error);
    }
  };

  const roles = [
    { value: USER_TYPE.STUDENT, label: USER_TYPE.STUDENT },
    { value: USER_TYPE.MENTOR, label: USER_TYPE.MENTOR },
  ];

  const inputs = [
    <FormInput
      key="username"
      label="Username"
      type="text"
      name="username"
      placeholder="Unique username"
      value={formData.username}
      onChange={handleChange}
    />,
    <FormInput
      key="name"
      label="Full Name"
      type="text"
      name="name"
      placeholder="Your full name"
      value={formData.name}
      onChange={handleChange}
    />,
    <FormInput
      key="email"
      label="Email Address"
      type="email"
      name="email"
      placeholder="you@domain.com"
      value={formData.email}
      onChange={handleChange}
    />,
    <FormInput
      key="password"
      label="Password"
      type="password"
      name="password"
      placeholder="********"
      value={formData.password}
      onChange={handleChange}
    />,
    <FormInput
      key="confirmPassword"
      label="Confirm Password"
      type="password"
      name="confirmPassword"
      placeholder="********"
      value={formData.confirmPassword}
      onChange={handleChange}
    />,
    <RoleSelector
      key="role"
      label="Select Role"
      name="role"
      roles={roles}
      value={formData.role}
      onChange={handleChange}
    />,
  ];

  return (
    <FormLayout
      heading="Create an Account"
      subHeading="Join our platform and explore your role"
      inputs={inputs}
      handleSubmit={handleSubmit}
      submitText="Register"
      navType="Login"
      navText="Account already exist ? "
      navLink="/arogyamanas/login"
    />
  );
};
export default Register;
