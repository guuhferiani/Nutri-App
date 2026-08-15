import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/neon';
import { getPacientes, getConsultas, calculateDashboardStats } from '../lib/api';
import Layout from '../components/Layout';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [stats, setStats] = useState({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: []
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 1. Verifica sessão do usuário
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await authClient.getSession();
        if (!result.data?.session) {
          navigate('/login');
          return;
        }
        setUser(result.data.user);
      } catch (err) {
        console.error('Erro na autenticação:', err);
        navigate('/login');
      } finally {
        setLoadingSession(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // 2. Carrega dados do Neon em tempo real
  const loadDashboardData = useCallback(async () => {
    setLoadingData(true);
    setError('');

    try {
      // Busca pacientes e consultas simultaneamente
      const [pacientesList, consultasList] = await Promise.all([
        getPacientes(),
        getConsultas()
      ]);

      const calculated = calculateDashboardStats(pacientesList, consultasList);
      setStats(calculated);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Não foi possível carregar os dados em tempo real do banco de dados.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  if (loadingSession) {
    return (
      <div className="page-loading-screen">
        <div className="spinner"></div>
        <p>Carregando painel...</p>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getFirstName = () => {
    if (!user?.name) return user?.email?.split('@')[0] || 'Nutricionista';
    return user.name.split(' ')[0];
  };

  const formatDateBR = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <Layout user={user}>
      <main className="dashboard-page">
        {/* Header do Dashboard */}
        <header className="page-header">
          <div className="header-text-block">
            <h1 className="page-title">
              {getGreeting()}, {getFirstName()} 👋
            </h1>
            <p className="page-subtitle">
              Aqui está o resumo da sua clínica e pacientes hoje.
            </p>
          </div>

          <div className="header-actions">
            <button
              onClick={loadDashboardData}
              disabled={loadingData}
              className="btn-action-secondary"
              title="Atualizar dados do Neon"
            >
              <svg
                className={`refresh-icon ${loadingData ? 'spinning' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>{loadingData ? 'Atualizando...' : 'Atualizar'}</span>
            </button>

            <Link to="/pacientes" className="btn-action-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Ver Pacientes</span>
            </Link>
          </div>
        </header>

        {error && (
          <div className="dashboard-alert error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Grade com os 2 Primeiros Cards de Estatística */}
        <section className="stats-grid">
          {/* Card 1: Total de Pacientes */}
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Total de Pacientes Ativos</span>
              <div className="stat-icon-wrapper color-primary">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>

            <div className="stat-body">
              {loadingData ? (
                <div className="skeleton skeleton-stat"></div>
              ) : (
                <div className="stat-value">{stats.totalPacientes}</div>
              )}
              <span className="stat-hint">Cadastrados sob seu acompanhamento</span>
            </div>

            <div className="stat-footer">
              <Link to="/pacientes" className="card-link">
                Gerenciar pacientes &rarr;
              </Link>
            </div>
          </div>

          {/* Card 2: Consultas da Semana */}
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Consultas da Semana</span>
              <div className="stat-icon-wrapper color-secondary">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            </div>

            <div className="stat-body">
              {loadingData ? (
                <div className="skeleton skeleton-stat"></div>
              ) : (
                <div className="stat-value">{stats.consultasSemana}</div>
              )}
              <span className="stat-hint">Registradas na semana atual</span>
            </div>

            <div className="stat-footer">
              <span className="stat-status-badge">Semana vigente</span>
            </div>
          </div>
        </section>

        {/* Card 3: Pacientes sem Retorno */}
        <section className="dashboard-section-card">
          <div className="section-card-header">
            <div className="section-title-group">
              <div className="section-icon-badge">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h2 className="section-title">Pacientes sem Retorno</h2>
                <p className="section-description">
                  Pacientes cuja última consulta foi há mais de 30 dias e não possuem retorno agendado.
                </p>
              </div>
            </div>

            {!loadingData && stats.pacientesSemRetorno.length > 0 && (
              <span className="alert-count-badge">
                {stats.pacientesSemRetorno.length}{' '}
                {stats.pacientesSemRetorno.length === 1 ? 'paciente' : 'pacientes'}
              </span>
            )}
          </div>

          <div className="section-card-content">
            {loadingData ? (
              <div className="skeleton-list">
                <div className="skeleton skeleton-row"></div>
                <div className="skeleton skeleton-row"></div>
                <div className="skeleton skeleton-row"></div>
              </div>
            ) : stats.pacientesSemRetorno.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3 className="empty-state-title">Nenhum paciente sem retorno no momento</h3>
                <p className="empty-state-subtitle">
                  Excelente! Todos os seus pacientes estão com o acompanhamento nutricional em dia ou com consultas agendadas.
                </p>
              </div>
            ) : (
              <div className="patient-list">
                {stats.pacientesSemRetorno.map((paciente) => (
                  <div key={paciente.id} className="patient-item">
                    <div className="patient-main-info">
                      <div className="patient-avatar">
                        {paciente.nome ? paciente.nome.substring(0, 2).toUpperCase() : 'PA'}
                      </div>
                      <div className="patient-names">
                        <Link
                          to={`/pacientes/${paciente.id}`}
                          className="patient-name-link"
                          title="Ver perfil completo do paciente"
                        >
                          {paciente.nome}
                        </Link>
                        <div className="patient-meta">
                          {paciente.whatsapp && (
                            <span className="patient-meta-item">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                              {paciente.whatsapp}
                            </span>
                          )}
                          {paciente.email && (
                            <span className="patient-meta-item">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                              </svg>
                              {paciente.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="patient-action-side">
                      <div className="consultation-tag">
                        <span className="tag-label">Última consulta:</span>
                        <span className="tag-date">{formatDateBR(paciente.ultimaConsultaData)}</span>
                        <span className="tag-badge-days">({paciente.diasSemConsulta} dias atrás)</span>
                      </div>

                      <Link
                        to={`/pacientes/${paciente.id}`}
                        className="btn-view-patient"
                      >
                        <span>Ver Perfil</span>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
}
