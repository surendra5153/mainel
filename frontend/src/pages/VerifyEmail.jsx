import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { client } from "../api/client";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMsg("No verification token found.");
            return;
        }

        client.get(`/auth/verify-email?token=${token}`)
            .then(() => {
                setStatus("success");
            })
            .catch((err) => {
                setStatus("error");
                setMsg(err.response?.data?.message || err.message || "Verification failed");
            });
    }, [token]);

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <div className="card max-w-md w-full p-8 text-center">
                {status === "verifying" && (
                    <div>
                        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <h2 className="text-xl font-bold">Verifying Email...</h2>
                    </div>
                )}
                {status === "success" && (
                    <div>
                        <div className="text-green-500 text-5xl mb-4">✓</div>
                        <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
                        <p className="text-gray-600 mb-6">Your account is now active.</p>
                        <Link to="/login" className="btn-primary inline-block px-8 py-2">
                            Go to Login
                        </Link>
                    </div>
                )}
                {status === "error" && (
                    <div>
                        <div className="text-red-500 text-5xl mb-4">✕</div>
                        <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
                        <p className="text-gray-600 mb-6">{msg}</p>
                        <Link to="/login" className="text-indigo-600 hover:underline">
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
