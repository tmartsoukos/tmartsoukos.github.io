export default function Card({ className = '', children, ...props }) {
  return (
    <div className={`rounded-2xl border border-line bg-surface p-4 ${className}`} {...props}>
      {children}
    </div>
  )
}
