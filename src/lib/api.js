import { fetchNeonDataAPI, authClient } from './neon';

/**
 * Busca todos os pacientes da nutricionista logada
 */
export async function getPacientes() {
  try {
    const data = await fetchNeonDataAPI('/pacientes?select=*&order=created_at.desc');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    return [];
  }
}

/**
 * Busca todas as consultas da nutricionista logada
 */
export async function getConsultas() {
  try {
    const data = await fetchNeonDataAPI('/consultas?select=*&order=data_consulta.desc');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erro ao buscar consultas:', error);
    return [];
  }
}

/**
 * Busca dados de um paciente específico pelo ID
 */
export async function getPacienteById(id) {
  try {
    const data = await fetchNeonDataAPI(`/pacientes?id=eq.${id}&select=*`);
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error(`Erro ao buscar paciente ${id}:`, error);
    return null;
  }
}

/**
 * Busca consultas de um paciente específico
 */
export async function getConsultasByPacienteId(pacienteId) {
  try {
    const data = await fetchNeonDataAPI(`/consultas?paciente_id=eq.${pacienteId}&select=*&order=data_consulta.desc`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Erro ao buscar consultas do paciente ${pacienteId}:`, error);
    return [];
  }
}

/**
 * Cria um novo paciente vinculado à nutricionista logada
 */
export async function createPaciente(pacienteData) {
  const sessionResult = await authClient.getSession();
  const userId = sessionResult.data?.user?.id;

  if (!userId) {
    throw new Error('Nutricionista não autenticada.');
  }

  const payload = {
    ...pacienteData,
    nutricionista_id: userId
  };

  // Sanitiza campos vazios para null
  Object.keys(payload).forEach((key) => {
    if (payload[key] === '' || payload[key] === undefined) {
      payload[key] = null;
    }
  });

  const res = await fetchNeonDataAPI('/pacientes', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return Array.isArray(res) && res.length > 0 ? res[0] : res;
}

/**
 * Atualiza os dados de um paciente existente
 */
export async function updatePaciente(id, pacienteData) {
  const payload = { ...pacienteData };
  delete payload.id;
  delete payload.created_at;

  // Sanitiza campos vazios para null
  Object.keys(payload).forEach((key) => {
    if (payload[key] === '' || payload[key] === undefined) {
      payload[key] = null;
    }
  });

  const res = await fetchNeonDataAPI(`/pacientes?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  return Array.isArray(res) && res.length > 0 ? res[0] : res;
}

/**
 * Calcula as métricas do Dashboard
 */
export function calculateDashboardStats(pacientes = [], consultas = []) {
  const now = new Date();
  
  // Início da semana (Segunda-feira 00:00:00)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay(); // 0 = Domingo, 1 = Segunda...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // Fim da semana (Domingo 23:59:59)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // 1. Total de pacientes
  const totalPacientes = pacientes.length;

  // 2. Consultas da semana atual
  const consultasSemana = consultas.filter((c) => {
    if (!c.data_consulta) return false;
    const parts = c.data_consulta.split('-');
    if (parts.length !== 3) return false;
    const [year, month, d] = parts.map(Number);
    const dateConsulta = new Date(year, month - 1, d);
    return dateConsulta >= startOfWeek && dateConsulta <= endOfWeek;
  }).length;

  // 3. Pacientes sem retorno (> 30 dias da última consulta e sem próximo retorno agendado)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const pacientesSemRetorno = [];

  pacientes.forEach((paciente) => {
    const consultasDoPaciente = consultas
      .filter((c) => c.paciente_id === paciente.id && c.data_consulta)
      .sort((a, b) => new Date(b.data_consulta) - new Date(a.data_consulta));

    if (consultasDoPaciente.length > 0) {
      const ultimaConsulta = consultasDoPaciente[0];
      const [y, m, d] = ultimaConsulta.data_consulta.split('-').map(Number);
      const dataUltima = new Date(y, m - 1, d);

      // Se a última consulta foi há mais de 30 dias
      if (dataUltima < thirtyDaysAgo) {
        let temProximoRetornoFuturo = false;
        if (ultimaConsulta.proximo_retorno) {
          const [ry, rm, rd] = ultimaConsulta.proximo_retorno.split('-').map(Number);
          const dataRetorno = new Date(ry, rm - 1, rd);
          if (dataRetorno >= now) {
            temProximoRetornoFuturo = true;
          }
        }

        if (!temProximoRetornoFuturo) {
          const diffTime = Math.abs(now - dataUltima);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          pacientesSemRetorno.push({
            ...paciente,
            ultimaConsultaData: ultimaConsulta.data_consulta,
            diasSemConsulta: diffDays
          });
        }
      }
    }
  });

  return {
    totalPacientes,
    consultasSemana,
    pacientesSemRetorno
  };
}
