import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authClient } from '../lib/neon';
import { createPaciente, updatePaciente, getPacienteById } from '../lib/api';
import Layout from '../components/Layout';

// Constantes de opções pré-definidas
const OBJETIVOS_OPCOES = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar'
];

const NIVEIS_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo'
];

const PATOLOGIAS_OPCOES = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto'
];

const RESTRICOES_OPCOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar'
];

const ALERGIAS_OPCOES = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar'
];

export default function PacienteForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pessoal'); // 'pessoal' | 'clinico' | 'habitos'
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Campos do formulário
  const [formData, setFormData] = useState({
    // Aba 1 - Pessoal
    nome: '',
    data_nascimento: '',
    sexo: '',
    whatsapp: '',
    email: '',

    // Aba 2 - Clínico
    peso_inicial: '',
    altura: '',
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [],
    restricoes_alimentares: [],
    alergias: [],
    medicamentos: '',
    suplementos: '',

    // Aba 3 - Hábitos
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: ''
  });

  // Campos extras para itens customizados adicionados pelo usuário
  const [customPatologia, setCustomPatologia] = useState('');
  const [customRestricao, setCustomRestricao] = useState('');
  const [customAlergia, setCustomAlergia] = useState('');

  // 1. Verifica autenticação e carrega dados se for edição
  useEffect(() => {
    const init = async () => {
      try {
        const sessionResult = await authClient.getSession();
        if (!sessionResult.data?.session) {
          navigate('/login');
          return;
        }
        setUser(sessionResult.data.user);

        if (isEditing) {
          const paciente = await getPacienteById(id);
          if (!paciente) {
            navigate('/pacientes');
            return;
          }
          setFormData({
            nome: paciente.nome || '',
            data_nascimento: paciente.data_nascimento || '',
            sexo: paciente.sexo || '',
            whatsapp: paciente.whatsapp || '',
            email: paciente.email || '',
            peso_inicial: paciente.peso_inicial !== null ? String(paciente.peso_inicial) : '',
            altura: paciente.altura !== null ? String(paciente.altura) : '',
            objetivos: Array.isArray(paciente.objetivos) ? paciente.objetivos : [],
            objetivo_texto: paciente.objetivo_texto || '',
            nivel_atividade: paciente.nivel_atividade || '',
            patologias: Array.isArray(paciente.patologias) ? paciente.patologias : [],
            restricoes_alimentares: Array.isArray(paciente.restricoes_alimentares) ? paciente.restricoes_alimentares : [],
            alergias: Array.isArray(paciente.alergias) ? paciente.alergias : [],
            medicamentos: paciente.medicamentos || '',
            suplementos: paciente.suplementos || '',
            refeicoes_por_dia: paciente.refeicoes_por_dia !== null ? String(paciente.refeicoes_por_dia) : '',
            horario_acorda: paciente.horario_acorda || '',
            horario_dorme: paciente.horario_dorme || '',
            litros_agua: paciente.litros_agua !== null ? String(paciente.litros_agua) : '',
            atividade_fisica: Boolean(paciente.atividade_fisica),
            atividade_fisica_descricao: paciente.atividade_fisica_descricao || '',
            observacoes: paciente.observacoes || ''
          });
        }
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar dados do paciente.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, isEditing, navigate]);

  // Manipuladores de inputs genéricos
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Cálculo da idade a partir da data de nascimento
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

  // Formatação de WhatsApp: (XX) XXXXX-XXXX
  const formatWhatsApp = (value) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Conversão de horário automático (ex: 6 -> "06:00", 630 -> "06:30", 23 -> "23:00")
  const formatTimeInput = (value) => {
    if (!value) return '';
    const clean = value.replace(/\D/g, '');
    if (!clean) return value;
    
    if (clean.length === 1 || clean.length === 2) {
      let h = parseInt(clean, 10);
      if (h > 23) h = 23;
      return `${String(h).padStart(2, '0')}:00`;
    }
    if (clean.length === 3) {
      let h = parseInt(clean.slice(0, 1), 10);
      let m = parseInt(clean.slice(1), 10);
      if (m > 59) m = 59;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    if (clean.length >= 4) {
      let h = parseInt(clean.slice(0, 2), 10);
      let m = parseInt(clean.slice(2, 4), 10);
      if (h > 23) h = 23;
      if (m > 59) m = 59;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return value;
  };

  // Cálculo do IMC
  const calcularIMC = () => {
    const peso = parseFloat(formData.peso_inicial);
    let altura = parseFloat(formData.altura);

    if (!peso || !altura || peso <= 0 || altura <= 0) return null;

    // Se a altura foi digitada em cm (ex: 175), converte para metros (1.75)
    if (altura > 3) {
      altura = altura / 100;
    }

    const imc = peso / (altura * altura);
    let classificacao = '';
    let colorClass = 'normal';

    if (imc < 18.5) {
      classificacao = 'Abaixo do peso';
      colorClass = 'warning';
    } else if (imc < 24.9) {
      classificacao = 'Peso normal / Adequado';
      colorClass = 'success';
    } else if (imc < 29.9) {
      classificacao = 'Sobrepeso';
      colorClass = 'warning';
    } else if (imc < 34.9) {
      classificacao = 'Obesidade Grau I';
      colorClass = 'error';
    } else if (imc < 39.9) {
      classificacao = 'Obesidade Grau II';
      colorClass = 'error';
    } else {
      classificacao = 'Obesidade Grau III';
      colorClass = 'error';
    }

    return {
      valor: imc.toFixed(1),
      classificacao,
      colorClass
    };
  };

  // Manipulação de arrays de múltipla escolha (toggle)
  const toggleArrayOption = (field, option) => {
    setFormData(prev => {
      const currentList = prev[field] || [];
      if (option === 'Nenhum') {
        return { ...prev, [field]: ['Nenhum'] };
      }
      
      const filtered = currentList.filter(item => item !== 'Nenhum');
      if (filtered.includes(option)) {
        return { ...prev, [field]: filtered.filter(item => item !== option) };
      } else {
        return { ...prev, [field]: [...filtered, option] };
      }
    });
  };

  // Adição de item customizado em listas
  const addCustomItem = (field, customValue, setCustomValue) => {
    const trimmed = customValue.trim();
    if (!trimmed) return;
    setFormData(prev => {
      const current = (prev[field] || []).filter(item => item !== 'Nenhum');
      if (!current.includes(trimmed)) {
        return { ...prev, [field]: [...current, trimmed] };
      }
      return prev;
    });
    setCustomValue('');
  };

  // Remover item de array
  const removeArrayItem = (field, itemToRemove) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter(i => i !== itemToRemove)
    }));
  };

  // Submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.nome.trim()) {
      setError('O nome completo do paciente é obrigatório.');
      setActiveTab('pessoal');
      return;
    }

    setSaving(true);

    try {
      // Formata campos numéricos
      const payload = {
        ...formData,
        nome: formData.nome.trim(),
        peso_inicial: formData.peso_inicial ? parseFloat(formData.peso_inicial) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        litros_agua: formData.litros_agua ? parseFloat(formData.litros_agua) : null,
        refeicoes_por_dia: formData.refeicoes_por_dia ? parseInt(formData.refeicoes_por_dia, 10) : null
      };

      let result;
      if (isEditing) {
        result = await updatePaciente(id, payload);
        setSuccessMessage('Paciente atualizado com sucesso!');
      } else {
        result = await createPaciente(payload);
        setSuccessMessage('Paciente cadastrado com sucesso!');
      }

      const pacienteId = result?.id || id;

      setTimeout(() => {
        navigate(`/pacientes/${pacienteId}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Ocorreu um erro ao salvar o paciente.');
      setSaving(false);
    }
  };

  const imcInfo = calcularIMC();
  const idade = calcularIdade(formData.data_nascimento);

  if (loading) {
    return (
      <Layout user={user}>
        <div className="page-loading-screen">
          <div className="spinner"></div>
          <p>Carregando formulário do paciente...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="dashboard-page">
        {/* Top Breadcrumb & Actions */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/pacientes" className="card-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            &larr; Voltar para Pacientes
          </Link>
        </div>

        <header className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div className="header-text-block">
            <h1 className="page-title">
              {isEditing ? `Editar: ${formData.nome || 'Paciente'}` : 'Novo Paciente'}
            </h1>
            <p className="page-subtitle">
              Preencha os dados pessoais, clínicos e hábitos para montar o prontuário.
            </p>
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

        {successMessage && (
          <div className="dashboard-alert" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMessage} Redirecionando...</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="form-tabs-container">
          <button
            type="button"
            className={`form-tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
            onClick={() => setActiveTab('pessoal')}
          >
            <span className="tab-number">1</span>
            <span>Pessoal</span>
          </button>

          <button
            type="button"
            className={`form-tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
            onClick={() => setActiveTab('clinico')}
          >
            <span className="tab-number">2</span>
            <span>Clínico</span>
          </button>

          <button
            type="button"
            className={`form-tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
            onClick={() => setActiveTab('habitos')}
          >
            <span className="tab-number">3</span>
            <span>Hábitos</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="patient-form-card">
          {/* =========================================================================
              ABA 1: DADOS PESSOAIS
              ========================================================================= */}
          {activeTab === 'pessoal' && (
            <div className="tab-pane-content">
              <h2 className="form-section-title">Dados Pessoais</h2>

              <div className="form-grid-2">
                <div className="form-group span-2">
                  <label className="form-label" htmlFor="nome">
                    Nome Completo <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    id="nome"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Maria Clara dos Santos"
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="data_nascimento">
                    Data de Nascimento {idade !== null && <span className="age-badge">({idade} anos)</span>}
                  </label>
                  <input
                    id="data_nascimento"
                    type="date"
                    className="form-input"
                    value={formData.data_nascimento}
                    onChange={(e) => handleChange('data_nascimento', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sexo">
                    Sexo
                  </label>
                  <select
                    id="sexo"
                    className="form-input"
                    value={formData.sexo}
                    onChange={(e) => handleChange('sexo', e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="whatsapp">
                    WhatsApp
                  </label>
                  <input
                    id="whatsapp"
                    type="tel"
                    className="form-input"
                    placeholder="(11) 99999-9999"
                    value={formData.whatsapp}
                    onChange={(e) => handleChange('whatsapp', formatWhatsApp(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="paciente@email.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-nav-actions">
                <div></div>
                <button
                  type="button"
                  className="btn-action-primary"
                  onClick={() => setActiveTab('clinico')}
                >
                  <span>Avançar para Clínico &rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              ABA 2: DADOS CLÍNICOS
              ========================================================================= */}
          {activeTab === 'clinico' && (
            <div className="tab-pane-content">
              <h2 className="form-section-title">Dados Clínicos & Antropometria</h2>

              {/* Medidas e IMC */}
              <div className="imc-calc-box">
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label" htmlFor="peso_inicial">
                      Peso Atual (kg)
                    </label>
                    <div className="input-suffix-wrapper">
                      <input
                        id="peso_inicial"
                        type="number"
                        step="0.1"
                        className="form-input"
                        placeholder="Ex: 72.5"
                        value={formData.peso_inicial}
                        onChange={(e) => handleChange('peso_inicial', e.target.value)}
                      />
                      <span className="input-suffix">kg</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="altura">
                      Altura (cm ou m)
                    </label>
                    <div className="input-suffix-wrapper">
                      <input
                        id="altura"
                        type="number"
                        step="0.01"
                        className="form-input"
                        placeholder="Ex: 170 ou 1.70"
                        value={formData.altura}
                        onChange={(e) => handleChange('altura', e.target.value)}
                      />
                      <span className="input-suffix">cm/m</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">IMC Calculado (Automático)</label>
                    <div className="imc-result-display">
                      {imcInfo ? (
                        <>
                          <span className="imc-value">{imcInfo.valor}</span>
                          <span className={`imc-badge ${imcInfo.colorClass}`}>
                            {imcInfo.classificacao}
                          </span>
                        </>
                      ) : (
                        <span className="imc-placeholder">Informe peso e altura</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Objetivos */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Objetivos Nutricionais (Múltipla escolha)</label>
                <div className="tags-selection-grid">
                  {OBJETIVOS_OPCOES.map((obj) => {
                    const isSelected = formData.objetivos.includes(obj);
                    return (
                      <button
                        key={obj}
                        type="button"
                        className={`tag-choice-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleArrayOption('objetivos', obj)}
                      >
                        {isSelected && '✓ '}
                        {obj}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Observação ou objetivo adicional..."
                  style={{ marginTop: '0.75rem' }}
                  value={formData.objetivo_texto}
                  onChange={(e) => handleChange('objetivo_texto', e.target.value)}
                />
              </div>

              {/* Nível de Atividade Física */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Nível de Atividade Física</label>
                <div className="radio-pills-grid">
                  {NIVEIS_ATIVIDADE.map((nivel) => (
                    <label
                      key={nivel}
                      className={`radio-pill-card ${formData.nivel_atividade === nivel ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="nivel_atividade"
                        value={nivel}
                        checked={formData.nivel_atividade === nivel}
                        onChange={() => handleChange('nivel_atividade', nivel)}
                      />
                      <span>{nivel}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Patologias */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Patologias ou Condições de Saúde</label>
                <div className="tags-selection-grid">
                  <button
                    type="button"
                    className={`tag-choice-btn ${formData.patologias.includes('Nenhum') ? 'selected' : ''}`}
                    onClick={() => toggleArrayOption('patologias', 'Nenhum')}
                  >
                    Nenhum
                  </button>
                  {PATOLOGIAS_OPCOES.map((pat) => {
                    const isSelected = formData.patologias.includes(pat);
                    return (
                      <button
                        key={pat}
                        type="button"
                        className={`tag-choice-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleArrayOption('patologias', pat)}
                      >
                        {isSelected && '✓ '}
                        {pat}
                      </button>
                    );
                  })}
                </div>

                {/* Itens personalizados adicionados */}
                {formData.patologias.filter(p => !PATOLOGIAS_OPCOES.includes(p) && p !== 'Nenhum').length > 0 && (
                  <div className="custom-tags-added">
                    {formData.patologias
                      .filter(p => !PATOLOGIAS_OPCOES.includes(p) && p !== 'Nenhum')
                      .map(custom => (
                        <span key={custom} className="custom-tag-badge">
                          {custom}
                          <button type="button" onClick={() => removeArrayItem('patologias', custom)}>×</button>
                        </span>
                      ))}
                  </div>
                )}

                <div className="add-custom-tag-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Adicionar outra patologia ou condição..."
                    value={customPatologia}
                    onChange={(e) => setCustomPatologia(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomItem('patologias', customPatologia, setCustomPatologia);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-action-secondary"
                    onClick={() => addCustomItem('patologias', customPatologia, setCustomPatologia)}
                  >
                    + Adicionar
                  </button>
                </div>
              </div>

              {/* Restrições Alimentares */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Restrições Alimentares</label>
                <div className="tags-selection-grid">
                  <button
                    type="button"
                    className={`tag-choice-btn ${formData.restricoes_alimentares.includes('Nenhum') ? 'selected' : ''}`}
                    onClick={() => toggleArrayOption('restricoes_alimentares', 'Nenhum')}
                  >
                    Nenhum
                  </button>
                  {RESTRICOES_OPCOES.map((res) => {
                    const isSelected = formData.restricoes_alimentares.includes(res);
                    return (
                      <button
                        key={res}
                        type="button"
                        className={`tag-choice-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleArrayOption('restricoes_alimentares', res)}
                      >
                        {isSelected && '✓ '}
                        {res}
                      </button>
                    );
                  })}
                </div>

                {formData.restricoes_alimentares.filter(r => !RESTRICOES_OPCOES.includes(r) && r !== 'Nenhum').length > 0 && (
                  <div className="custom-tags-added">
                    {formData.restricoes_alimentares
                      .filter(r => !RESTRICOES_OPCOES.includes(r) && r !== 'Nenhum')
                      .map(custom => (
                        <span key={custom} className="custom-tag-badge">
                          {custom}
                          <button type="button" onClick={() => removeArrayItem('restricoes_alimentares', custom)}>×</button>
                        </span>
                      ))}
                  </div>
                )}

                <div className="add-custom-tag-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Adicionar outra restrição..."
                    value={customRestricao}
                    onChange={(e) => setCustomRestricao(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomItem('restricoes_alimentares', customRestricao, setCustomRestricao);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-action-secondary"
                    onClick={() => addCustomItem('restricoes_alimentares', customRestricao, setCustomRestricao)}
                  >
                    + Adicionar
                  </button>
                </div>
              </div>

              {/* Alergias Alimentares */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Alergias Alimentares</label>
                <div className="tags-selection-grid">
                  <button
                    type="button"
                    className={`tag-choice-btn ${formData.alergias.includes('Nenhum') ? 'selected' : ''}`}
                    onClick={() => toggleArrayOption('alergias', 'Nenhum')}
                  >
                    Nenhum
                  </button>
                  {ALERGIAS_OPCOES.map((ale) => {
                    const isSelected = formData.alergias.includes(ale);
                    return (
                      <button
                        key={ale}
                        type="button"
                        className={`tag-choice-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleArrayOption('alergias', ale)}
                      >
                        {isSelected && '✓ '}
                        {ale}
                      </button>
                    );
                  })}
                </div>

                {formData.alergias.filter(a => !ALERGIAS_OPCOES.includes(a) && a !== 'Nenhum').length > 0 && (
                  <div className="custom-tags-added">
                    {formData.alergias
                      .filter(a => !ALERGIAS_OPCOES.includes(a) && a !== 'Nenhum')
                      .map(custom => (
                        <span key={custom} className="custom-tag-badge">
                          {custom}
                          <button type="button" onClick={() => removeArrayItem('alergias', custom)}>×</button>
                        </span>
                      ))}
                  </div>
                )}

                <div className="add-custom-tag-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Adicionar outra alergia..."
                    value={customAlergia}
                    onChange={(e) => setCustomAlergia(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomItem('alergias', customAlergia, setCustomAlergia);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-action-secondary"
                    onClick={() => addCustomItem('alergias', customAlergia, setCustomAlergia)}
                  >
                    + Adicionar
                  </button>
                </div>
              </div>

              {/* Medicamentos e Suplementos */}
              <div className="form-grid-2" style={{ marginTop: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="medicamentos">
                    Medicamentos Contínuos
                  </label>
                  <textarea
                    id="medicamentos"
                    rows="3"
                    className="form-input"
                    placeholder="Ex: Losartana 50mg pela manhã..."
                    value={formData.medicamentos}
                    onChange={(e) => handleChange('medicamentos', e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="suplementos">
                    Suplementos em Uso
                  </label>
                  <textarea
                    id="suplementos"
                    rows="3"
                    className="form-input"
                    placeholder="Ex: Whey Protein, Creatina 5g, Vitamina D..."
                    value={formData.suplementos}
                    onChange={(e) => handleChange('suplementos', e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="form-nav-actions">
                <button
                  type="button"
                  className="btn-action-secondary"
                  onClick={() => setActiveTab('pessoal')}
                >
                  &larr; Voltar para Pessoal
                </button>

                <button
                  type="button"
                  className="btn-action-primary"
                  onClick={() => setActiveTab('habitos')}
                >
                  <span>Avançar para Hábitos &rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              ABA 3: HÁBITOS E ROTINA
              ========================================================================= */}
          {activeTab === 'habitos' && (
            <div className="tab-pane-content">
              <h2 className="form-section-title">Hábitos e Rotina Diária</h2>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="refeicoes_por_dia">
                    Quantas refeições faz por dia?
                  </label>
                  <input
                    id="refeicoes_por_dia"
                    type="number"
                    min="1"
                    max="10"
                    className="form-input"
                    placeholder="Ex: 4"
                    value={formData.refeicoes_por_dia}
                    onChange={(e) => handleChange('refeicoes_por_dia', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="litros_agua">
                    Consumo diário de água
                  </label>
                  <div className="input-suffix-wrapper">
                    <input
                      id="litros_agua"
                      type="number"
                      step="0.1"
                      className="form-input"
                      placeholder="Ex: 2.5"
                      value={formData.litros_agua}
                      onChange={(e) => handleChange('litros_agua', e.target.value)}
                    />
                    <span className="input-suffix">litros</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="horario_acorda">
                    Horário que acorda
                  </label>
                  <input
                    id="horario_acorda"
                    type="text"
                    className="form-input"
                    placeholder="Ex: 6 (06:00) ou 630 (06:30)"
                    value={formData.horario_acorda}
                    onChange={(e) => handleChange('horario_acorda', e.target.value)}
                    onBlur={(e) => handleChange('horario_acorda', formatTimeInput(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="horario_dorme">
                    Horário que dorme
                  </label>
                  <input
                    id="horario_dorme"
                    type="text"
                    className="form-input"
                    placeholder="Ex: 23 (23:00) ou 2230 (22:30)"
                    value={formData.horario_dorme}
                    onChange={(e) => handleChange('horario_dorme', e.target.value)}
                    onBlur={(e) => handleChange('horario_dorme', formatTimeInput(e.target.value))}
                  />
                </div>
              </div>

              {/* Atividade Física */}
              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label">Pratica atividade física?</label>
                <div className="radio-group-horizontal">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="atividade_fisica"
                      checked={formData.atividade_fisica === true}
                      onChange={() => handleChange('atividade_fisica', true)}
                    />
                    <span>Sim</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="atividade_fisica"
                      checked={formData.atividade_fisica === false}
                      onChange={() => handleChange('atividade_fisica', false)}
                    />
                    <span>Não</span>
                  </label>
                </div>

                {formData.atividade_fisica && (
                  <div style={{ marginTop: '1rem' }}>
                    <label className="form-label" htmlFor="atividade_fisica_descricao">
                      Qual atividade e frequência semanal?
                    </label>
                    <textarea
                      id="atividade_fisica_descricao"
                      rows="2"
                      className="form-input"
                      placeholder="Ex: Musculação 4x na semana e corrida aos sábados"
                      value={formData.atividade_fisica_descricao}
                      onChange={(e) => handleChange('atividade_fisica_descricao', e.target.value)}
                    ></textarea>
                  </div>
                )}
              </div>

              {/* Observações Gerais */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label" htmlFor="observacoes">
                  Observações Gerais
                </label>
                <textarea
                  id="observacoes"
                  rows="4"
                  className="form-input"
                  placeholder="Informações adicionais relevantes para a anamnese e plano..."
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                ></textarea>
              </div>

              <div className="form-nav-actions">
                <button
                  type="button"
                  className="btn-action-secondary"
                  onClick={() => setActiveTab('clinico')}
                >
                  &larr; Voltar para Clínico
                </button>

                <button
                  type="submit"
                  className="btn-action-primary"
                  disabled={saving}
                  style={{ minWidth: '180px' }}
                >
                  <span>{saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Concluir Cadastro'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
}
