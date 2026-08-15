import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/neon';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authClient.signIn.email({ email, password });
      
      if (result?.error) {
        let msg = result.error.message || 'Falha ao fazer login. Verifique suas credenciais.';
        if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credential')) {
          msg = 'E-mail ou senha incorretos.';
        }
        setError(msg);
        setLoading(false);
        return;
      }
      
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      let msg = err?.message || 'Falha ao fazer login. Verifique suas credenciais.';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credential')) {
        msg = 'E-mail ou senha incorretos.';
      }
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-theme-switch-top">
        <ThemeToggle />
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">NA</div>
          <h1 className="auth-title">Nutri App</h1>
          <p className="auth-subtitle">Faça login para acessar o sistema</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin}>
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-footer">
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </div>
      </div>
    </div>
  );
}
