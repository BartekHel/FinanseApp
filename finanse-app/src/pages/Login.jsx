import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.status === 200) {
        const data = await res.json();
        localStorage.setItem('user', JSON.stringify(data.user));

        if (Notification.permission === 'granted') {
          new Notification('Zalogowano!', {
            body: `Witamy ponownie, ${username}!`,
            icon: '/assets/icon-192.png'
          });
        } else {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Zalogowano!', {
                body: `Witamy ponownie, ${username}!`,
                icon: '/assets/icon-192.png'
              });
            }
          });
        }

        navigate('/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Nieprawidłowe dane logowania');
      }
    } catch (err) {
      setError('Błąd połączenia z serwerem');
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Logowanie</h2>
      <form id="loginForm" className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Login:</label>
          <input
            type="text"
            id="username"
            name="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Hasło:</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="btn-primary full-width">Zaloguj się</button>
      </form>
      <p className="auth-bottom-text">
        Nie masz konta? <Link to="/register">Zarejestruj się</Link>
      </p>
    </div>
  );
}
