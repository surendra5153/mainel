import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchMe } from "../../api/auth";

export default function OAuthCallback() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function fetchUser() {
      try {
        // Check if OAuth failed
        const oauthError = searchParams.get('error');
        if (oauthError) {
          console.error('OAuth error:', oauthError);
          navigate("/login");
          return;
        }

        // Check if OAuth was successful
        const oauthSuccess = searchParams.get('oauth');
        if (oauthSuccess !== 'success') {
          navigate("/login");
          return;
        }

        const res = await fetchMe();
        if (!res.user) { 
          navigate("/login"); 
          return; 
        }
        setUser(res.user);
        navigate("/home");
      } catch (err) {
        console.error("OAuth callback error:", err);
        navigate("/login");
      }
    }
    fetchUser();
  }, [navigate, searchParams, setUser]);

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Finalizing login...</p>
      </div>
    </div>
  );
}
