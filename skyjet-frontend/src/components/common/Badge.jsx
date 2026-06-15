export default function Badge({ label, color, className = '' }) {
  const style = color
    ? { background: color + '20', color, borderColor: color + '40', border: '1px solid' }
    : {};
  return (
    <span className={`badge badge-category ${className}`} style={style}>
      {label}
    </span>
  );
}