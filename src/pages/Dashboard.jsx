import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/neon';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const result = await authClient.getSession();
        if (!result.data?.session) {
          navigate('/login');
          return;
        }
        setUser(result.data.user);
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    await authClient.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">NA</div>
          Nutri App
        </div>
        <button onClick={handleLogout} className="btn btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
          Sair
        </button>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-card">
          <h2 style={{ marginBottom: '1rem' }}>Bem-vindo(a), {user?.name || user?.email}!</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Seu sistema de gestão para nutricionistas.
          </p>
        </div>
      </main>
    </div>
  );
}
