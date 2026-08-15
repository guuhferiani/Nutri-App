import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/neon';
import { getPacientes, getConsultas } from '../lib/api';
import Layout from '../components/Layout';

export default function Pacientes() {
  const [user, setUser] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [consultasMap, setConsultasMap] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionResult = await authClient.getSession();
        if (!sessionResult.data?.session) {
          navigate('/login');
          return;
        }
        setUser(sessionResult.data.user);
        
        // Busca pacientes e consultas para associar a última consulta de cada paciente
        const [pData, cData] = await Promise.all([
          getPacientes(),
          getConsultas()
        ]);

        setPacientes(pData);

        // Mapeia última consulta por paciente_id
        const map = {};
        cData.forEach(c => {
          if (c.paciente_id && c.data_consulta) {
            if (!map[c.paciente_id] || new Date(c.data_consulta) > new Date(map[c.paciente_id])) {
              map[c.paciente_id] = c.data_consulta;
            }
          }
        });
        setConsultasMap(map);
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
    p.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDateBR = (dateStr) => {
    if (!dateStr) return 'Nenhuma consulta registrada';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const formatObjetivos = (paciente) => {
    if (Array.isArray(paciente.objetivos) && paciente.objetivos.length > 0) {
      return paciente.objetivos.join(', ');
    }
    if (paciente.objetivo_texto) {
      return paciente.objetivo_texto;
    }
    return 'Não informado';
  };

  return (
    <Layout user={user}>
      <div className="dashboard-page">
        {/* Header da Listagem */}
        <header className="page-header">
          <div className="header-text-block">
            <h1 className="page-title">Pacientes</h1>
            <p className="page-subtitle">Gerencie o prontuário e acompanhamento dos seus pacientes.</p>
          </div>

          <div className="header-actions">
            <Link to="/pacientes/novo" className="btn-action-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Novo Paciente</span>
            </Link>
          </div>
        </header>

        {/* Card Principal de Listagem */}
        <section className="dashboard-section-card">
          <div className="section-card-header" style={{ flexWrap: 'wrap', gap: '1rem', background: '#fafbfc' }}>
            <div className="search-bar-wrapper" style={{ flex: 1, minWidth: '280px' }}>
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="form-input search-input"
                placeholder="Buscar paciente por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="stat-hint" style={{ alignSelf: 'center', fontWeight: 600 }}>
              {filtered.length} {filtered.length === 1 ? 'paciente' : 'pacientes'}
            </div>
          </div>

          <div className="section-card-content">
            {loading ? (
              <div className="skeleton-list">
                <div className="skeleton skeleton-row"></div>
                <div className="skeleton skeleton-row"></div>
                <div className="skeleton skeleton-row"></div>
              </div>
            ) : pacientes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ background: '#f8fafc', color: 'var(--color-primary)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                </div>
                <h3 className="empty-state-title">Nenhum paciente cadastrado ainda</h3>
                <p className="empty-state-subtitle" style={{ marginBottom: '1.25rem' }}>
                  Comece cadastrando seu primeiro paciente para gerenciar consultas e planos alimentares.
                </p>
                <Link to="/pacientes/novo" className="btn-action-primary" style={{ display: 'inline-flex' }}>
                  + Cadastrar Primeiro Paciente
                </Link>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <h3 className="empty-state-title">Nenhum paciente encontrado</h3>
                <p className="empty-state-subtitle">Nenhum paciente corresponde ao nome digitado.</p>
              </div>
            ) : (
              <div className="patient-list">
                {filtered.map(paciente => {
                  const ultimaConsulta = consultasMap[paciente.id];
                  return (
                    <div key={paciente.id} className="patient-item">
                      <div className="patient-main-info">
                        <div className="patient-avatar">
                          {paciente.nome ? paciente.nome.substring(0, 2).toUpperCase() : 'PA'}
                        </div>
                        <div className="patient-names">
                          <Link
                            to={`/pacientes/${paciente.id}`}
                            className="patient-name-link"
                            title="Ver prontuário do paciente"
                          >
                            {paciente.nome}
                          </Link>
                          
                          <div className="patient-meta" style={{ gap: '0.875rem' }}>
                            <span className="patient-meta-item">
                              <strong>Objetivo:</strong> {formatObjetivos(paciente)}
                            </span>
                            {paciente.whatsapp && (
                              <span className="patient-meta-item">
                                <strong>WhatsApp:</strong> {paciente.whatsapp}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="patient-action-side">
                        <div className="consultation-tag">
                          <span className="tag-label">Última consulta:</span>
                          <span className="tag-date" style={{ color: ultimaConsulta ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                            {formatDateBR(ultimaConsulta)}
                          </span>
                        </div>

                        <Link
                          to={`/pacientes/${paciente.id}`}
                          className="btn-view-patient"
                        >
                          <span>Acessar Prontuário</span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
