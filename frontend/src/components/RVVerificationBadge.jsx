export default function RVVerificationBadge({ status, expiresAt }) {
  if (status !== 'verified') return null;

  const isExpired = expiresAt && new Date() > new Date(expiresAt);
  if (isExpired) return null; // Don't show verified badge if expired

  return (
    <span
      className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200 flex items-center gap-1 cursor-help"
      title={`Valid until: ${new Date(expiresAt).toLocaleDateString()}`}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      Verified (RV College)
    </span>
  );
}
