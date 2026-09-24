import { useState, createContext, useContext } from "react";

const AuthContext = createContext(null);

export const ROLES = {
  EMPLOYEE: "employee",
  MANAGER: "manager",
  ADMIN: "admin",
};

const DEMO_USERS = {
  employee: {
    id: 1,
    name: "Alex Morgan",
    role: "Software Support Engineer",
    department: "Engineering",
    level: "Intermediate",
    avatar: "AM",
    userRole: ROLES.EMPLOYEE,
    onboardingProgress: 68,
  },
  manager: {
    id: 6,
    name: "Sarah Chen",
    role: "Team Leader / Tech Lead",
    department: "Engineering",
    avatar: "SC",
    userRole: ROLES.MANAGER,
    onboardingProgress: 100,
  },
  admin: {
    id: 7,
    name: "Jordan Lee",
    role: "HR Admin",
    department: "Human Resources",
    avatar: "JL",
    userRole: ROLES.ADMIN,
    onboardingProgress: 100,
  },
};

export function useAuthProvider() {
  const [user, setUser] = useState(null);

  const login = (roleKey) => {
    setUser(DEMO_USERS[roleKey] || DEMO_USERS.employee);
    return DEMO_USERS[roleKey]?.userRole || ROLES.EMPLOYEE;
  };

  const logout = () => setUser(null);

  return { user, login, logout, isAuthenticated: !!user };
}

export function useAuth() {
  return useContext(AuthContext);
}

export { AuthContext };
