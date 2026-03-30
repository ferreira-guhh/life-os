const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-zinc-800 text-zinc-300",
    amber:   "bg-amber-500/20 text-amber-400",
    green:   "bg-emerald-500/20 text-emerald-400",
    red:     "bg-red-500/20 text-red-400",
    blue:    "bg-blue-500/20 text-blue-400",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${variants[variant]}`}>
      {children}
    </span>
  );
};
export default Badge;