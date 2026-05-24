export default function EmptyIllustration({ type = 'order' }) {
  const icon = type === 'order' ? (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" fill="#F1F5F9" />
      <path d="M28 40 L52 40 M40 28 L40 52" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="40" r="4" fill="#94A3B8" />
    </svg>
  ) : (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="30" width="40" height="30" rx="4" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
      <path d="M30 45 L50 45" stroke="#94A3B8" strokeWidth="2" />
      <path d="M35 35 L45 35" stroke="#94A3B8" strokeWidth="2" />
    </svg>
  );
  return <div className="flex flex-col items-center justify-center py-8">{icon}</div>;
}