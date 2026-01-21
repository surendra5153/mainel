import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { client } from "../api/client";
import { notifySuccess, notifyError } from "../utils/toast";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
                <div className="card p-8 text-center text-red-600">
                    Invalid or missing reset token.
                    <br /><br />
                    <Link to="/forgot-password" className="text-indigo-600 underline">Request a new link</Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) return notifyError("Password mist be at least 6 chars");
        if (password !== confirm) return notifyError("Passwords do not match");

        setLoading(true);
        try {
            await client.post('/auth/reset-password', { token, newPassword: password });
            setSuccess(true);
            notifySuccess("Password reset successfully!");
        } catch (err) {
            notifyError(err.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <div className="card max-w-md w-full p-8">
                <h2 className="text-2xl font-bold text-center mb-6">Set New Password</h2>

                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="input-field"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="New password (min 6 chars)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                required
                                className="input-field"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                placeholder="Confirm new password"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full py-2 disabled:opacity-70">
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                ) : (
                    <div className="text-center">
                        <div className="text-green-500 text-4xl mb-4">✓</div>
                        <p className="text-gray-700 mb-6">
                            Your password has been updated. You can now log in with your new credentials.
                        </p>
                        <Link to="/login" className="btn-primary inline-block px-6 py-2">Go to Login</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
