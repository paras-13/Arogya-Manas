import React, { useEffect, createContext, useReducer } from "react";
import { AUTH_ACTIONS } from "../utils/constants";

// initial state
const initialState = {
  token: localStorage.getItem("token") || null,
  user: JSON.parse(localStorage.getItem("user")) || null,
};

// reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN:
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        token: null,
        user: null,
      };
    default:
      return state;
  }
};

// Create Context
export const AuthContext = createContext({
  authState: {},
  authDispatcher: () => {},
  logout: () => {},
});

// Provider
export const AuthProvider = ({ children }) => {
  const [authState, authDispatcher] = useReducer(authReducer, initialState);
  const logout = () => {
    authDispatcher({ type: AUTH_ACTIONS.LOGOUT });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };
  useEffect(() => {
    if (authState.token) {
      localStorage.setItem("token", authState.token);
      localStorage.setItem("user", JSON.stringify(authState.user));
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, [authState]);

  const state = {
    authState,
    authDispatcher,
    logout,
  };
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};
