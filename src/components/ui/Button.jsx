// Κουμπί με μεγάλα touch targets — η εφαρμογή χρησιμοποιείται
// όρθια, με το ένα χέρι, συχνά με γάντια ή βρεγμένα δάχτυλα.

const VARIANTS = {
  primary: 'bg-brand text-bg font-bold active:bg-brand-dark',
  danger: 'bg-absent text-white font-bold',
  subtle: 'bg-surface-2 text-text border border-line',
  ghost: 'bg-transparent text-muted',
}

const SIZES = {
  sm: 'min-h-10 px-3 text-sm rounded-lg',
  md: 'min-h-12 px-4 text-base rounded-xl',
  lg: 'min-h-14 px-5 text-lg rounded-xl',
  xl: 'min-h-18 px-6 text-xl rounded-2xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
