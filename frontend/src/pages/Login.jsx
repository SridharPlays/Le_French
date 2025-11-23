import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import api from "../api/axiosClient";
import Logo from "../components/Logo";
import { Mail, Lock, LogIn } from "lucide-react";
import { toast } from "react-hot-toast";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", formData);
      login(response.data.user);
      toast.success("Logged in successfully!");
      navigate(response.data.user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-red-800">
        <div className="flex justify-center mb-4">
          <Logo className="w-16 h-16" />
        </div>
        <h2 className="text-3xl font-bold text-red-900 text-center mb-6">
          Bon Retour!
        </h2>
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email"
              className="w-full pl-10 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-800 focus:outline-none"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-10 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-800 focus:outline-none"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-800 text-white font-bold py-2 px-4 rounded hover:bg-red-900 transition flex justify-center items-center gap-2"
          >
            {loading ? (
              "Logging in..."
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Login
              </>
            )}
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-red-800 font-bold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Login;
