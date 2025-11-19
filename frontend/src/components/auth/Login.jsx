import { useContext, useState } from "react";
import { FormLayout, FormInput, RoleSelector } from "../ui/Forms";
import { AUTH_ACTIONS, USER_TYPE } from "../../utils/constants";
import { toast } from "react-toastify";
import api from "../../api";
import { AuthContext } from "../../store/AuthContext";
import { useNavigate } from "react-router-dom";
const Login = () => {
  const { authDispatcher } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const res = await api.post("/accounts/login/", formData);
      authDispatcher({
        type: AUTH_ACTIONS.LOGIN,
        payload: {
          token: res.data.token,
          user: res.data.user,
        },
      });
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response.data.error);
    }
  };

  const roles = [
    { value: USER_TYPE.STUDENT, label: USER_TYPE.STUDENT },
    { value: USER_TYPE.MENTOR, label: USER_TYPE.MENTOR },
    { value: USER_TYPE.ADMIN, label: USER_TYPE.ADMIN },
  ];

  const inputs = [
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
      heading="Login Your Account"
      subHeading="Join our platform and explore your role"
      inputs={inputs}
      handleSubmit={handleSubmit}
      submitText="Login"
      navType="Register"
      navLink="/arogyamanas/register"
      navText="New User? Create Account: "
    />
  );
};
export default Login;
