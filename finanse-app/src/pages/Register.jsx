import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Hasła nie są takie same');
      return;
    }

    try {
      const API_BASE_URL =
        import.meta.env.MODE === 'development'
          ? 'http://localhost:5000'
          : 'https://us-central1-finanseapp-270402.cloudfunctions.net/api';

      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (res.status === 201) {
        if (Notification.permission === 'granted') {
          new Notification('Rejestracja zakończona!', {
            body: 'Możesz teraz zarządzać swoimi finansami.',
            icon: '/assets/icon-192.png'
          });
        } else {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Rejestracja zakończona!', {
                body: 'Możesz teraz zarządzać swoimi finansami.',
                icon: '/assets/icon-192.png'
              });
            }
          });
        }

        navigate('/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Wystąpił błąd podczas rejestracji');
      }
    } catch (err) {
      setError('Błąd połączenia z serwerem');
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Rejestracja</h2>
      <form id="registerForm" className="auth-form" onSubmit={handleSubmit}>
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
        <div className="form-group">
          <label htmlFor="confirmPassword">Powtórz hasło:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="btn-primary full-width">Zarejestruj się</button>
      </form>
      <p className="auth-bottom-text">
        Masz już konto? <Link to="/login">Zaloguj się</Link>
      </p>
    </div>
  );
}
