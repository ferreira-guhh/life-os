export function Card({ children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-4 ${
        onClick ? "cursor-pointer active:scale-98" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
export default Card;