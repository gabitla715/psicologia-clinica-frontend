// lucide-react no incluye el logo de TikTok (solo Facebook/Instagram/etc.),
// así que este es un ícono simple hecho a mano con el mismo estilo (24x24, currentColor).
export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82c-.9-.79-1.44-1.94-1.44-3.2h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.43 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.7 5.7c3.13 0 5.69-2.55 5.69-5.7V9.01a7.34 7.34 0 0 0 4.3 1.38V7.3s-1.89.09-3.25-1.48Z" />
    </svg>
  );
}
