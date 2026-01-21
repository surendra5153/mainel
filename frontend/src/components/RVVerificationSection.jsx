import { useState, useEffect } from 'react';
import { startRVVerification, verifyRVOTP, getRVVerificationStatus } from '../api/rvVerification';
import { notifySuccess, notifyError } from '../utils/toast';
import RVProfileForm from './RVProfileForm';
import { Check, AlertCircle } from 'lucide-react';

export default function RVVerificationSection() {
  const [status, setStatus] = useState('none');
  const [emailVerified, setEmailVerified] = useState(false);
  const [rvEmail, setRvEmail] = useState('');
  const [rvLoginId, setRvLoginId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const data = await getRVVerificationStatus();
      setStatus(data.status);
      setEmailVerified(data.emailVerified || false);
      setVerificationData(data);

      if (data.status === 'pending' || data.status === 'verified') {
        setRvEmail(data.rvEmail || '');
      }
    } catch (err) {
      console.error('Failed to load RV verification status:', err);
    }
  }

  async function handleSendOTP() {
    if (!rvEmail.trim()) {
      notifyError('Please enter your RV email');
      return;
    }

    setLoading(true);
    try {
      const result = await startRVVerification({
        rvEmail: rvEmail.trim(),
        rvLoginId: rvLoginId.trim() || undefined
      });

      if (result.success) {
        notifySuccess('OTP sent to your RV email');
        setOtpSent(true);
        setStatus('pending');
      }
    } catch (err) {
      console.error(err);
      notifyError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (!otp.trim() || otp.trim().length !== 6) {
      notifyError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyRVOTP({ otp: otp.trim() });

      if (result.success) {
        notifySuccess(result.message || 'RV College verification successful!');
        setStatus('verified');
        setEmailVerified(true);
        await loadStatus();
      }
    } catch (err) {
      console.error(err);
      notifyError(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'verified') {
    const isExpired = verificationData?.expiresAt && new Date() > new Date(verificationData.expiresAt);

    if (isExpired) {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-orange-900">Verification Expired</h3>
              <p className="text-sm text-orange-700 mt-1">
                Your RV College verification expired on {new Date(verificationData.expiresAt).toLocaleDateString()}.
                Please re-verify to maintain your status.
              </p>
              <button
                onClick={() => {
                  setStatus('none');
                  setOtpSent(false);
                  setOtp('');
                  setEmailVerified(false);
                }}
                className="mt-4 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition"
              >
                Re-verify Now
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="w-full">
            <h3 className="text-lg font-semibold text-green-900">RV College Verified</h3>
            <p className="text-sm text-green-700 mt-1">
              Your RV College email <strong>{verificationData?.rvEmail}</strong> has been verified.
            </p>
            {verificationData?.expiresAt && (
              <p className="text-xs text-green-600 mt-2 mb-4">
                Valid until: {new Date(verificationData.expiresAt).toLocaleDateString()}
              </p>
            )}

            {/* RV Profile Section (Branch & Year) */}
            <div className="bg-white/60 p-4 rounded-lg border border-green-100 mt-2">
              <RVProfileForm
                initialData={verificationData?.rvProfile}
                onUpdate={loadStatus}
              />
            </div>

            <div className="mt-4">
              <button
                onClick={() => {
                  // Optional: Logic to force re-verification if needed
                  setStatus('none'); setEmailVerified(false); setOtp('');
                }}
                className="text-xs text-green-700 hover:text-green-900 underline opacity-60 hover:opacity-100"
              >
                Reset Verification
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">Verification Rejected</h3>
            <p className="text-sm text-red-700 mt-1">
              Your verification request has been rejected. Please contact support or re-submit with correct information.
            </p>
            {verificationData?.notes && (
              <p className="text-sm text-red-600 mt-2 bg-red-100 p-2 rounded">
                <strong>Note:</strong> {verificationData.notes}
              </p>
            )}
            <button
              onClick={() => {
                setStatus('none');
                setOtpSent(false);
                setOtp('');
              }}
              className="mt-4 text-sm text-red-700 hover:text-red-900 font-medium"
            >
              Start New Verification
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">RV College Verification</h3>
        <p className="text-sm text-gray-600 mt-1">
          Verify your RV College affiliation with your college email.
        </p>
      </div>

      <div className="space-y-4">
        {/* RV Email */}
        <div>
          <label htmlFor="rvEmail" className="block text-sm font-medium text-gray-700 mb-2">
            RV College Email <span className="text-red-500">*</span>
          </label>
          <input
            id="rvEmail"
            type="email"
            value={rvEmail}
            onChange={(e) => setRvEmail(e.target.value)}
            placeholder="student@rvce.edu.in"
            disabled={status === 'pending'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use your official RV College email (@rvce.edu.in, @rv.edu.in, or @ms.rvce.edu.in)
          </p>
        </div>

        {/* RV Login ID (Optional) */}
        <div>
          <label htmlFor="rvLoginId" className="block text-sm font-medium text-gray-700 mb-2">
            RV Login ID <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            id="rvLoginId"
            type="text"
            value={rvLoginId}
            onChange={(e) => setRvLoginId(e.target.value)}
            placeholder="23RVCS123"
            disabled={status === 'pending'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Send OTP Button */}
        {!otpSent && status !== 'pending' && (
          <button
            type="button"
            onClick={handleSendOTP}
            disabled={loading || !rvEmail}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send OTP to RV Email'}
          </button>
        )}

        {/* OTP Input */}
        {(otpSent || (status === 'pending' && !emailVerified)) && (
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP <span className="text-red-500">*</span>
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Check your RV email for the 6-digit code
              </p>
            </div>

            <button
              type="button"
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Resend OTP
            </button>

            <button
              type="button"
              onClick={() => {
                setStatus('none');
                setOtpSent(false);
                setOtp('');
              }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium mt-2"
            >
              Change Email
            </button>
          </div>
        )}

        {/* Status Messages */}
        {status === 'pending' && emailVerified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Email Verified!</strong> Your RV College email has been verified successfully.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
