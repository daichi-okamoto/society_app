import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function useAuthActions() {
  const { setUser } = useAuth();

  const login = async ({ email, password }) => {
    const data = await api.post("/auth/login", { email, password });
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const data = await api.post("/auth/register", payload);
    setUser(data.user);
    return data.user;
  };

  const registerAdmin = async (payload) => {
    const data = await api.post("/auth/admin/register", payload);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return { login, register, registerAdmin, logout };
}
