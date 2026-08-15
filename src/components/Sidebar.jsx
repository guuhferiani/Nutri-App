import { NavLink, useNavigate } from 'react-router-dom';
import { authClient } from '../lib/neon';
import ThemeToggle from './ThemeToggle';

export default function Sidebar({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch (e) {
      console.error('Erro ao sair:', e);
    } finally {
      navigate('/login');
    }
  };

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return 'NA';
  };

  return (
    <aside className="sidebar">
      {/* Top Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">NA</div>
          <span className="sidebar-logo-text">Nutri APP</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-group">
          <span className="sidebar-nav-title">Menu Principal</span>
          
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <svg
              className="sidebar-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/pacientes"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <svg
              className="sidebar-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Pacientes</span>
          </NavLink>
        </div>
      </nav>

      {/* Footer Profile & Logout */}
      <div className="sidebar-footer">
        <ThemeToggle />

        <div className="user-profile-widget">
          <div className="user-avatar">
            {getInitials(user?.name, user?.email)}
          </div>
          <div className="user-details">
            <span className="user-name" title={user?.name || user?.email}>
              {user?.name || 'Nutricionista'}
            </span>
            <span className="user-email" title={user?.email}>
              {user?.email}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-logout"
          title="Encerrar sessão"
        >
          <svg
            className="logout-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
