export default function Avatar({ user, size = 'md', className = '' }) {
  const sizeClass = `avatar avatar-${size}`;
  const initials = user?.initials || user?.name?.slice(0, 2).toUpperCase() || '?';

  return (
    <span className={`${sizeClass} ${className}`} title={user?.name}>
      {user?.avatar_url
        ? <img src={user.avatar_url} alt={user.name} />
        : initials
      }
    </span>

  );
}
