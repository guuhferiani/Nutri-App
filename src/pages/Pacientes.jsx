import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/neon';
import { getPacientes } from '../lib/api';
import Layout from '../components/Layout';

export default function Pacientes() {
  const [user, setUser] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await authClient.getSession();
        if (!result.data?.session) {
          navigate('/login');
          return;
        }
        setUser(result.data.user);
        
        const data = await getPacientes();
        setPacientes(data);
      } catch (err) {
        console.error(err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const filtered = pacientes.filter(p => 
    p.nome?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.whatsapp?.includes(search)
  );

  return (
    <Layout user={user}>
      <div className="dashboard-page">
        <header className="page-header">
          <div className="header-text-block">
            <h1 className="page-title">Pacientes</h1>
            <p className="page-subtitle">Gerencie e visualize todos os seus pacientes cadastrados.</p>
          </div>
        </header>

        <section className="dashboard-section-card">
          <div className="section-card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '280px', flex: 1 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por nome, e-mail ou whatsapp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="stat-hint" style={{ alignSelf: 'center' }}>
              {filtered.length} paciente(s) encontrado(s)
            </div>
          </div>

          <div className="section-card-content">
            {loading ? (
              <div className="skeleton-list">
                <div className="skeleton skeleton-row"></div>
                <div className="skeleton skeleton-row"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <h3 className="empty-state-title">Nenhum paciente encontrado</h3>
                <p className="empty-state-subtitle">Não encontramos nenhum paciente com os filtros informados.</p>
              </div>
            ) : (
              <div className="patient-list">
                {filtered.map(paciente => (
                  <div key={paciente.id} className="patient-item">
                    <div className="patient-main-info">
                      <div className="patient-avatar">
                        {paciente.nome ? paciente.nome.substring(0, 2).toUpperCase() : 'PA'}
                      </div>
                      <div className="patient-names">
                        <Link to={`/pacientes/${paciente.id}`} className="patient-name-link">
                          {paciente.nome}
                        </Link>
                        <div className="patient-meta">
                          {paciente.email && <span>{paciente.email}</span>}
                          {paciente.whatsapp && <span> • {paciente.whatsapp}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="patient-action-side">
                      <Link to={`/pacientes/${paciente.id}`} className="btn-view-patient">
                        <span>Ver Perfil</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
