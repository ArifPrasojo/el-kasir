export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="256" cy="256" r="256" fill="#2563EB"/>
      <path d="M160 180h200l-20 120H180l-20-120z" fill="white" opacity="0.95"/>
      <path d="M140 160h40" stroke="white" strokeWidth="16" strokeLinecap="round"/>
      <path d="M130 140l30 20" stroke="white" strokeWidth="16" strokeLinecap="round"/>
      <circle cx="200" cy="340" r="22" fill="white"/>
      <circle cx="200" cy="340" r="10" fill="#2563EB"/>
      <circle cx="320" cy="340" r="22" fill="white"/>
      <circle cx="320" cy="340" r="10" fill="#2563EB"/>
      <rect x="200" y="210" width="120" height="12" rx="6" fill="#2563EB" opacity="0.3"/>
      <rect x="200" y="235" width="90" height="12" rx="6" fill="#2563EB" opacity="0.3"/>
      <rect x="200" y="260" width="105" height="12" rx="6" fill="#2563EB" opacity="0.3"/>
      <circle cx="360" cy="180" r="45" fill="#10B981"/>
      <path d="M345 180l10 10 20-20" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
