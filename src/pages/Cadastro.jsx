import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/neon';

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

    if (password.length < 9) {
      setError('A senha deve ter no mínimo 9 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // 1. Cadastra no Neon Auth (Better Auth)
      const result = await authClient.signUp.email({ 
        name: nome, 
        email: email, 
        password: password 
      });
      
      if (result?.error) {
        let msg = result.error.message || 'Falha ao criar conta.';
        if (msg.includes('Password does not meet') || msg.toLowerCase().includes('password')) {
          msg = 'A senha não atende aos requisitos de segurança (mínimo 9 caracteres).';
        } else if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
          msg = 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.';
        }
        setError(msg);
        setLoading(false);
        return;
      }

      // Usuário autenticado com sucesso
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      let msg = err?.message || 'Ocorreu um erro durante o cadastro.';
      if (msg.includes('Password does not meet') || msg.toLowerCase().includes('password')) {
        msg = 'A senha não atende aos requisitos de segurança (mínimo 9 caracteres).';
      } else if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
        msg = 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.';
      }
      setError(msg);
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
              placeholder="Mínimo 9 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={9}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirmar Senha</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Repita a senha (mínimo 9 caracteres)"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={9}
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
