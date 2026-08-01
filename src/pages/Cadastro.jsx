import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authClient, fetchNeonDataAPI } from '../lib/neon';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Verifica se já está logado
  useEffect(() => {
    authClient.getSession().then((result) => {
      if (result.data?.session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  const handleCadastro = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // 1. Cadastra no Neon Auth (Managed Better Auth)
      const result = await authClient.signUp.email({ 
        name: nome, 
        email: email, 
        password: password 
      });
      
      if (result.error) {
        setError(result.error.message || 'Falha ao criar conta. O email já pode estar em uso.');
        setLoading(false);
        return;
      }

      // Após cadastro bem sucedido, o usuário já está logado no Auth e temos um token
      const sessionResult = await authClient.getSession();
      const userId = sessionResult.data?.user?.id;

      if (!userId) {
        throw new Error("Usuário criado, mas não foi possível obter a sessão.");
      }

      // 2. Salva o nutricionista no banco de dados Neon via Data API
      // O RLS vai verificar se o id bate com o id do jwt (sub)
      try {
        await fetchNeonDataAPI('/nutricionistas', {
          method: 'POST',
          body: JSON.stringify({
            id: userId,
            nome: nome,
            email: email
          })
        });
      } catch (dbError) {
        console.error("Erro ao salvar nutricionista no DB", dbError);
        // Mesmo com erro no DB, o usuário foi criado no Auth, mas é bom registrar o erro.
      }

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro inesperado durante o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">NA</div>
          <h1 className="auth-title">Nutri App</h1>
          <p className="auth-subtitle">Crie sua conta como nutricionista</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleCadastro}>
          <div className="form-group">
            <label className="form-label" htmlFor="nome">Nome Completo</label>
            <input
              id="nome"
              type="text"
              className="form-input"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Min. 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirmar Senha</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="auth-footer">
          Já tem conta? <Link to="/login">Faça login</Link>
        </div>
      </div>
    </div>
  );
}
