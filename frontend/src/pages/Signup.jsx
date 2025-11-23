import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import api from "../api/axiosClient";
import { User, Mail, Lock, Fingerprint, Users, ArrowRight } from "lucide-react";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    registration_number: "",
    batch_id: "",
  });
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get("/auth/batches");
        setBatches(res.data);
        if (res.data.length > 0)
          setFormData((f) => ({ ...f, batch_id: res.data[0].batch_id }));
      } catch (err) {
        console.error(err);
      }
    };
    fetchBatches();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/register", formData);
      login(response.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-xl border-t-4 border-red-800">
        <h2 className="mt-2 text-center text-3xl font-extrabold text-red-900">
          Create Account
        </h2>
        {error && (
          <div className="text-red-600 text-center bg-red-100 p-2 rounded text-sm">
            {error}
          </div>
        )}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              name="name"
              type="text"
              required
              className="pl-10 w-full px-3 py-2 border rounded focus:ring-red-800 focus:outline-none"
              placeholder="Full Name"
              onChange={handleChange}
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              name="email"
              type="email"
              required
              className="pl-10 w-full px-3 py-2 border rounded focus:ring-red-800 focus:outline-none"
              placeholder="Email"
              onChange={handleChange}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              name="password"
              type="password"
              required
              className="pl-10 w-full px-3 py-2 border rounded focus:ring-red-800 focus:outline-none"
              placeholder="Password"
              onChange={handleChange}
            />
          </div>
          <div className="relative">
            <Fingerprint className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              name="registration_number"
              type="text"
              className="pl-10 w-full px-3 py-2 border rounded focus:ring-red-800 focus:outline-none"
              placeholder="Registration # (Optional)"
              onChange={handleChange}
            />
          </div>
          <div className="relative">
            <Users className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <select
              name="batch_id"
              className="pl-10 w-full px-3 py-2 border rounded focus:ring-red-800 focus:outline-none"
              onChange={handleChange}
              value={formData.batch_id}
              required
            >
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.batch_name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-800 hover:bg-red-900 items-center gap-2"
          >
            {loading ? (
              "Creating..."
            ) : (
              <>
                Register <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-red-800 font-bold hover:underline"
          >
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Signup;
