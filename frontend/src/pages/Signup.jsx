// src/pages/Signup.jsx
import React, { useState } from "react";
import { registerUser } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { notifySuccess, notifyError, notifyApiError } from "../utils/toast";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", securityQuestion: "", securityAnswer: "" });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    // Basic regex check
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(form.email)) {
      notifyError("Invalid email format");
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser(form);
      if (res.user) {
        setUser(res.user);
        notifySuccess("Account created — logged in");
        navigate("/home");
      } else {
        notifyError(res.message || (res.errors && res.errors[0]?.msg) || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      notifyApiError(err, "Signup failed - please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 card p-8 sm:p-10">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the community and start swapping skills today
          </p>
        </div>

        {successMsg ? (
          <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg text-center animate-fade-in">
            <div className="text-5xl mb-4">📧</div>
            <h3 className="font-bold text-lg mb-2">Check Your Inbox</h3>
            <p className="text-gray-600 mb-6">{successMsg}</p>
            <Link to="/login" className="btn-primary inline-block px-6 py-2 w-full">
              Proceed to Login
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="input-field"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
              </div>

              {/* Security Question */}
              <div className="pt-2 border-t border-gray-100 mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Security Question (For Password Recovery)
                </label>
                <select
                  value={form.securityQuestion}
                  onChange={e => setForm({ ...form, securityQuestion: e.target.value })}
                  className="input-field mb-3"
                  required
                >
                  <option value="">Select a question...</option>
                  <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                  <option value="What was your first pet's name?">What was your first pet's name?</option>
                  <option value="What is your favorite hobby?">What is your favorite hobby?</option>
                  <option value="What is the name of your first school?">What is the name of your first school?</option>
                </select>

                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Your Answer (e.g. Fluffy)"
                  value={form.securityAnswer}
                  onChange={(e) => setForm({ ...form, securityAnswer: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">This is the ONLY way to recover your account if you forget your password.</p>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center py-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Create account"
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
