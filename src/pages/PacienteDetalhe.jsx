import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/neon';
import { getPacienteById, getConsultasByPacienteId } from '../lib/api';
import Layout from '../components/Layout';

export default function PacienteDetalhe() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const sessionResult = await authClient.getSession();
        if (!sessionResult.data?.session) {
          navigate('/login');
          return;
        }
        setUser(sessionResult.data.user);

        const [pData, cData] = await Promise.all([
          getPacienteById(id),
          getConsultasByPacienteId(id)
        ]);

        if (!pData) {
          navigate('/pacientes');
          return;
        }

        setPaciente(pData);
        setConsultas(cData);
      } catch (err) {
        console.error(err);
        navigate('/pacientes');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  const formatDateBR = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  return (
    <Layout user={user}>
      <div className="dashboard-page">
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/dashboard" className="card-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            &larr; Voltar ao Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="skeleton-list">
            <div className="skeleton skeleton-stat"></div>
            <div className="skeleton skeleton-row"></div>
          </div>
        ) : !paciente ? (
          <div className="empty-state">
            <h3 className="empty-state-title">Paciente não encontrado</h3>
          </div>
        ) : (
          <>
            <header className="page-header">
              <div className="header-text-block">
                <h1 className="page-title">{paciente.nome}</h1>
                <p className="page-subtitle">Prontuário e histórico de acompanhamento nutricional</p>
              </div>
            </header>

            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <span className="stat-label">Contato</span>
                <div style={{ marginTop: '0.75rem', fontSize: '0.95rem' }}>
                  <p><strong>Email:</strong> {paciente.email || 'Não informado'}</p>
                  <p><strong>WhatsApp:</strong> {paciente.whatsapp || 'Não informado'}</p>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-label">Dados Iniciais</span>
                <div style={{ marginTop: '0.75rem', fontSize: '0.95rem' }}>
                  <p><strong>Peso Inicial:</strong> {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '-'}</p>
                  <p><strong>Altura:</strong> {paciente.altura ? `${paciente.altura} m` : '-'}</p>
                </div>
              </div>
            </div>

            <section className="dashboard-section-card">
              <div className="section-card-header">
                <h2 className="section-title">Histórico de Consultas ({consultas.length})</h2>
              </div>
              <div className="section-card-content">
                {consultas.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-state-subtitle">Nenhuma consulta registrada para este paciente ainda.</p>
                  </div>
                ) : (
                  <div className="patient-list">
                    {consultas.map(consulta => (
                      <div key={consulta.id} className="patient-item">
                        <div>
                          <strong>Data da Consulta:</strong> {formatDateBR(consulta.data_consulta)}
                          {consulta.peso && <span style={{ marginLeft: '1rem' }}><strong>Peso:</strong> {consulta.peso} kg</span>}
                          {consulta.percentual_gordura && <span style={{ marginLeft: '1rem' }}><strong>% Gordura:</strong> {consulta.percentual_gordura}%</span>}
                        </div>
                        <div>
                          {consulta.proximo_retorno ? (
                            <span className="tag-date" style={{ color: 'var(--color-primary)' }}>
                              Retorno: {formatDateBR(consulta.proximo_retorno)}
                            </span>
                          ) : (
                            <span className="tag-badge-days">Sem retorno agendado</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
