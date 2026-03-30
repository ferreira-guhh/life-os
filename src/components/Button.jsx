export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-40";
  const sizes = {
    sm: "text-sm px-3 py-2",
    md: "text-base px-4 py-3",
    lg: "text-base px-5 py-4 w-full",
  };
  const variants = {
    primary: "bg-amber-500 text-zinc-950 hover:bg-amber-400",
    ghost: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
    danger: "bg-red-500/20 text-red-400 hover:bg-red-500/30",
    outline: "border border-zinc-700 text-zinc-300 hover:bg-zinc-800",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
export default Button;