# 🥗 Nutri App — Sistema de Gestão para Nutricionistas

O **Nutri App** é uma plataforma moderna e completa voltada para nutricionistas gerenciarem seus pacientes, consultas, evolução antropométrica e planos alimentares com segurança e agilidade.

---

## ✨ Principais Funcionalidades

- **🔐 Autenticação Segura (Neon Auth)**:
  - Cadastro e login para nutricionistas com validações de segurança.
  - Sessão persistente no navegador.
  - Isolamento de dados garantido por **Row Level Security (RLS)** no PostgreSQL.

- **📊 Dashboard em Tempo Real**:
  - **Total de Pacientes Ativos**: Métricas de acompanhamento em tempo real.
  - **Consultas da Semana**: Contador dinâmico de atendimentos na semana vigente.
  - **Alerta de Pacientes sem Retorno**: Identificação automática de pacientes cuja última consulta foi há mais de 30 dias e que não possuem próximo retorno agendado.

- **👥 Gestão e Prontuário de Pacientes**:
  - Listagem com busca instantânea por nome, e-mail ou WhatsApp.
  - Visualização detalhada do perfil, histórico de consultas e dados antropométricos.

- **📈 Consultas & Planos Alimentares**:
  - Histórico de consultas, pesagens e percentual de gordura.
  - Estrutura pronta para planos alimentares em formato JSONB.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**:
  - [React 19](https://react.dev/) + [Vite](https://vite.dev/)
  - [React Router DOM v7](https://reactrouter.com/)
  - CSS3 Vanilla (Design System moderno com cores Bordeaux e Dourado)
  - Typography: Google Fonts (*Plus Jakarta Sans* e *Inter*)

- **Banco de Dados & Autenticação**:
  - [Neon Serverless Postgres](https://neon.tech/)
  - **Neon Auth** (Managed Better Auth)
  - **Neon Data API** (REST / PostgREST)
  - **Row Level Security (RLS)** & Triggers SQL

- **Linter & Otimização**:
  - [Oxlint](https://oxc.rs/)

---

## 📁 Estrutura do Projeto

```text
├── _prompts/                  # Documentação dos prompts e regras do projeto
├── public/                    # Arquivos estáticos e favicons
├── src/
│   ├── components/            # Componentes reutilizáveis
│   │   ├── Layout.jsx         # Estrutura principal da aplicação
│   │   └── Sidebar.jsx        # Menu lateral fixo de navegação
│   ├── lib/                   # Configurações de API e integrações
│   │   ├── api.js             # Chamadas à Data API do Neon e cálculo de métricas
│   │   └── neon.js            # Cliente Neon Auth e fetch wrapper
│   ├── pages/                 # Páginas da aplicação
│   │   ├── Cadastro.jsx       # Tela de criação de conta
│   │   ├── Dashboard.jsx      # Painel de métricas e alertas
│   │   ├── Login.jsx          # Tela de autenticação
│   │   ├── PacienteDetalhe.jsx # Perfil e prontuário do paciente
│   │   └── Pacientes.jsx      # Lista e busca de pacientes
│   ├── App.jsx                # Roteamento central da aplicação
│   ├── index.css              # Design system e folhas de estilo
│   └── main.jsx               # Ponto de entrada da aplicação
├── .env.example               # Exemplo de variáveis de ambiente
├── .gitignore                 # Arquivos ignorados no controle de versão
├── index.html                 # Template HTML principal
├── package.json               # Dependências e scripts do projeto
├── vite.config.js             # Configurações do Vite
└── README.md                  # Documentação do projeto
```

---

## 🚀 Como Executar o Projeto Localmente

### 1. Clonar o Repositório

```bash
git clone https://github.com/guuhferiani/Nutri-App.git
cd Nutri-App
```

### 2. Instalar as Dependências

```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes chaves do seu projeto no **Neon**:

```env
VITE_NEON_AUTH_URL=https://ep-winter-rice-acv0qk4o.neonauth.sa-east-1.aws.neon.tech/neondb/auth
VITE_NEON_DATA_API_URL=https://ep-winter-rice-acv0qk4o.apirest.sa-east-1.aws.neon.tech/neondb/rest/v1
```

### 4. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173) no seu navegador.

---

## 🚢 Deploy (Vercel)

1. Faça o fork ou push do repositório no seu GitHub.
2. Importe o repositório na [Vercel](https://vercel.com).
3. Adicione as variáveis de ambiente `VITE_NEON_AUTH_URL` e `VITE_NEON_DATA_API_URL`.
4. Clique em **Deploy**.
5. No **Console do Neon**, adicione o domínio gerado pela Vercel em **Auth** > **Settings** > **Trusted Origins**.

---

## 📝 Licença

Este projeto foi desenvolvido para fins educacionais e profissionais. Sinta-se à vontade para utilizar e expandir.
