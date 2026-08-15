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
  const [activeDetailTab, setActiveDetailTab] = useState('clinico'); // 'clinico' | 'habitos' | 'consultas'
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

  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return null;
    const parts = dataNasc.split('-');
    if (parts.length !== 3) return null;
    const birthDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const calcularIMC = () => {
    if (!paciente?.peso_inicial || !paciente?.altura) return null;
    const peso = parseFloat(paciente.peso_inicial);
    let altura = parseFloat(paciente.altura);
    if (!peso || !altura) return null;
    if (altura > 3) altura = altura / 100;

    const imc = peso / (altura * altura);
    let classificacao = '';
    let colorClass = 'normal';

    if (imc < 18.5) {
      classificacao = 'Abaixo do peso';
      colorClass = 'warning';
    } else if (imc < 24.9) {
      classificacao = 'Peso normal';
      colorClass = 'success';
    } else if (imc < 29.9) {
      classificacao = 'Sobrepeso';
      colorClass = 'warning';
    } else {
      classificacao = 'Obesidade';
      colorClass = 'error';
    }

    return { valor: imc.toFixed(1), classificacao, colorClass };
  };

  const imcInfo = calcularIMC();
  const idade = paciente ? calcularIdade(paciente.data_nascimento) : null;

  return (
    <Layout user={user}>
      <div className="dashboard-page">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/pacientes" className="card-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            &larr; Voltar para Lista de Pacientes
          </Link>

          {paciente && (
            <Link to={`/pacientes/${paciente.id}/editar`} className="btn-action-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Editar Paciente</span>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="skeleton-list">
            <div className="skeleton skeleton-row" style={{ height: '120px' }}></div>
            <div className="skeleton skeleton-row"></div>
            <div className="skeleton skeleton-row"></div>
          </div>
        ) : !paciente ? (
          <div className="empty-state">
            <h3 className="empty-state-title">Paciente não encontrado</h3>
          </div>
        ) : (
          <>
            {/* Perfil Header Card */}
            <div className="patient-profile-header-card">
              <div className="profile-header-main">
                <div className="profile-avatar">
                  {paciente.nome ? paciente.nome.substring(0, 2).toUpperCase() : 'PA'}
                </div>
                <div className="profile-info">
                  <h1 className="profile-title">{paciente.nome}</h1>
                  <div className="profile-badges-row">
                    {idade !== null && <span className="profile-pill">{idade} anos</span>}
                    {paciente.sexo && <span className="profile-pill">{paciente.sexo}</span>}
                    {paciente.whatsapp && (
                      <a
                        href={`https://wa.me/55${paciente.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="profile-pill whatsapp"
                        title="Conversar no WhatsApp"
                      >
                        💬 {paciente.whatsapp}
                      </a>
                    )}
                    {paciente.email && (
                      <span className="profile-pill email">✉️ {paciente.email}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
              <div className="stat-card">
                <span className="stat-label">Peso Inicial</span>
                <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>
                  {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '-'}
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-label">Altura</span>
                <div className="stat-value" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>
                  {paciente.altura ? (paciente.altura > 3 ? `${paciente.altura} cm` : `${paciente.altura} m`) : '-'}
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-label">IMC Inicial</span>
                <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span className="stat-value" style={{ fontSize: '1.75rem' }}>{imcInfo?.valor || '-'}</span>
                  {imcInfo && (
                    <span className={`imc-badge ${imcInfo.colorClass}`} style={{ fontSize: '0.75rem' }}>
                      {imcInfo.classificacao}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs do Prontuário */}
            <div className="form-tabs-container">
              <button
                type="button"
                className={`form-tab-btn ${activeDetailTab === 'clinico' ? 'active' : ''}`}
                onClick={() => setActiveDetailTab('clinico')}
              >
                <span>Dados Clínicos & Anamnese</span>
              </button>

              <button
                type="button"
                className={`form-tab-btn ${activeDetailTab === 'habitos' ? 'active' : ''}`}
                onClick={() => setActiveDetailTab('habitos')}
              >
                <span>Hábitos & Rotina</span>
              </button>

              <button
                type="button"
                className={`form-tab-btn ${activeDetailTab === 'consultas' ? 'active' : ''}`}
                onClick={() => setActiveDetailTab('consultas')}
              >
                <span>Histórico de Consultas ({consultas.length})</span>
              </button>
            </div>

            {/* Conteúdo Aba Clínico */}
            {activeDetailTab === 'clinico' && (
              <div className="dashboard-section-card" style={{ padding: '1.75rem' }}>
                <div className="detail-section-group">
                  <h3 className="detail-group-title">🎯 Objetivos</h3>
                  <div className="tags-display-row">
                    {Array.isArray(paciente.objetivos) && paciente.objetivos.length > 0 ? (
                      paciente.objetivos.map(obj => (
                        <span key={obj} className="badge-tag-primary">{obj}</span>
                      ))
                    ) : (
                      <span className="text-muted">Nenhum objetivo selecionado</span>
                    )}
                  </div>
                  {paciente.objetivo_texto && (
                    <p className="detail-note-box" style={{ marginTop: '0.75rem' }}>
                      <strong>Nota:</strong> {paciente.objetivo_texto}
                    </p>
                  )}
                </div>

                <div className="detail-section-group" style={{ marginTop: '1.5rem' }}>
                  <h3 className="detail-group-title">⚡ Nível de Atividade Física</h3>
                  <p className="detail-text-item">{paciente.nivel_atividade || 'Não informado'}</p>
                </div>

                <div className="detail-section-group" style={{ marginTop: '1.5rem' }}>
                  <h3 className="detail-group-title">🩺 Patologias & Condições de Saúde</h3>
                  <div className="tags-display-row">
                    {Array.isArray(paciente.patologias) && paciente.patologias.length > 0 ? (
                      paciente.patologias.map(pat => (
                        <span key={pat} className="badge-tag-warning">{pat}</span>
                      ))
                    ) : (
                      <span className="text-muted">Nenhuma condição informada</span>
                    )}
                  </div>
                </div>

                <div className="detail-section-group" style={{ marginTop: '1.5rem' }}>
                  <h3 className="detail-group-title">🚫 Restrições & Alergias Alimentares</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Restrições:</strong>
                      <div className="tags-display-row" style={{ marginTop: '0.25rem' }}>
                        {Array.isArray(paciente.restricoes_alimentares) && paciente.restricoes_alimentares.length > 0 ? (
                          paciente.restricoes_alimentares.map(res => (
                            <span key={res} className="badge-tag-warning">{res}</span>
                          ))
                        ) : (
                          <span className="text-muted">Nenhuma</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Alergias:</strong>
                      <div className="tags-display-row" style={{ marginTop: '0.25rem' }}>
                        {Array.isArray(paciente.alergias) && paciente.alergias.length > 0 ? (
                          paciente.alergias.map(ale => (
                            <span key={ale} className="badge-tag-error">{ale}</span>
                          ))
                        ) : (
                          <span className="text-muted">Nenhuma</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: '1.5rem' }}>
                  <div className="detail-section-group">
                    <h3 className="detail-group-title">💊 Medicamentos Contínuos</h3>
                    <p className="detail-note-box">{paciente.medicamentos || 'Nenhum medicamento informado'}</p>
                  </div>

                  <div className="detail-section-group">
                    <h3 className="detail-group-title">🥛 Suplementos em Uso</h3>
                    <p className="detail-note-box">{paciente.suplementos || 'Nenhum suplemento informado'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo Aba Hábitos */}
            {activeDetailTab === 'habitos' && (
              <div className="dashboard-section-card" style={{ padding: '1.75rem' }}>
                <div className="form-grid-2">
                  <div className="detail-section-group">
                    <h3 className="detail-group-title">🍽️ Refeições por Dia</h3>
                    <p className="detail-text-item">{paciente.refeicoes_por_dia ? `${paciente.refeicoes_por_dia} refeições` : 'Não informado'}</p>
                  </div>

                  <div className="detail-section-group">
                    <h3 className="detail-group-title">💧 Consumo de Água</h3>
                    <p className="detail-text-item">{paciente.litros_agua ? `${paciente.litros_agua} litros/dia` : 'Não informado'}</p>
                  </div>

                  <div className="detail-section-group">
                    <h3 className="detail-group-title">⏰ Horário que Acorda</h3>
                    <p className="detail-text-item">{paciente.horario_acorda || 'Não informado'}</p>
                  </div>

                  <div className="detail-section-group">
                    <h3 className="detail-group-title">🌙 Horário que Dorme</h3>
                    <p className="detail-text-item">{paciente.horario_dorme || 'Não informado'}</p>
                  </div>
                </div>

                <div className="detail-section-group" style={{ marginTop: '1.5rem' }}>
                  <h3 className="detail-group-title">🏃 Prática de Atividade Física</h3>
                  <p className="detail-text-item">
                    {paciente.atividade_fisica ? 'Sim' : 'Não'}
                  </p>
                  {paciente.atividade_fisica_descricao && (
                    <p className="detail-note-box" style={{ marginTop: '0.5rem' }}>
                      {paciente.atividade_fisica_descricao}
                    </p>
                  )}
                </div>

                <div className="detail-section-group" style={{ marginTop: '1.5rem' }}>
                  <h3 className="detail-group-title">📝 Observações Gerais</h3>
                  <p className="detail-note-box">{paciente.observacoes || 'Nenhuma observação registrada.'}</p>
                </div>
              </div>
            )}

            {/* Conteúdo Aba Consultas */}
            {activeDetailTab === 'consultas' && (
              <div className="dashboard-section-card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 className="detail-group-title" style={{ margin: 0 }}>Histórico de Consultas</h3>
                </div>

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
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
