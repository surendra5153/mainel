import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { client } from "../api/client";
import { notifySuccess, notifyError } from "../utils/toast";

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1=Email, 2=Security Question
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    // Security Question State
    const [securityQuestion, setSecurityQuestion] = useState("");
    const [securityAnswer, setSecurityAnswer] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const navigate = useNavigate();

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);

        try {
            // Check for security question
            const checkRes = await client.post('/auth/recovery-check', { email });

            if (checkRes?.hasSecurityQuestion) {
                setSecurityQuestion(checkRes.question);
                setStep(2); // Move to security question step
                notifySuccess("Security Question Found!");
            } else {
                notifyError("Security recovery is not enabled for this email. Please contact support.");
            }

        } catch (err) {
            notifyError("Account not found");
        } finally {
            setLoading(false);
        }
    };

    const handleQuestionSubmit = async (e) => {
        e.preventDefault();
        if (!securityAnswer || !newPassword) return;
        setLoading(true);

        try {
            await client.post('/auth/reset-password-question', {
                email,
                listAnswer: securityAnswer,
                newPassword: newPassword
            });
            notifySuccess("Password Reset Successfully!");
            navigate('/login');
        } catch (err) {
            notifyError(err.response?.data?.message || "Incorrect answer or lockout.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <div className="card max-w-md w-full p-8">
                <h2 className="text-2xl font-bold text-center mb-6">
                    {step === 1 ? 'Reset Password' : 'Security Check'}
                </h2>

                {step === 1 && !sent && (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="input-field"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter your registered email"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full py-2 disabled:opacity-70">
                            {loading ? "Checking..." : "Continue"}
                        </button>
                    </form>
                )}



                {step === 2 && (
                    <form onSubmit={handleQuestionSubmit} className="space-y-4">
                        <div className="bg-indigo-50 p-3 rounded border border-indigo-100 mb-4">
                            <p className="text-xs text-indigo-600 font-bold uppercase">Security Question</p>
                            <p className="font-medium text-indigo-900">{securityQuestion}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Answer</label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={securityAnswer}
                                onChange={e => setSecurityAnswer(e.target.value)}
                                placeholder="Answer (case insensitive)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="input-field"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Min 6 characters"
                            />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-2 disabled:opacity-70">
                            {loading ? "Verifying..." : "Reset Password"}
                        </button>


                    </form>
                )}

                {step === 1 && !sent && (
                    <div className="text-center mt-4">
                        <Link to="/login" className="text-sm text-indigo-600 hover:underline">Back to Login</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
