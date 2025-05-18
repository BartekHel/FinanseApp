import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export default function Main() {
  const [data, setData] = useState(generateInitialData());

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1].value;
        const delta = (Math.random() - 0.5) * 5;
        const next = Math.max(0, last + delta);
        const updated = [...prev.slice(1), { name: '', value: parseFloat(next.toFixed(2)) }];
        return updated;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  function generateInitialData() {
    const base = 500;
    const data = [{ name: '', value: base }];

    for (let i = 1; i < 60; i++) {
      const prev = data[i - 1].value;
      const delta = (Math.random() - 0.5) * 5;
      const next = Math.max(0, prev + delta);
      data.push({ name: '', value: parseFloat(next.toFixed(2)) });
    }

    return data;
  }

  return (
    <div>
      <header className="header">
        <nav className="nav">
          <div className="nav-logo">
            <img src="/assets/icon-192.png" alt="Logo" className="logo-image" />
            Finanse App
          </div>
          <div className="nav-links">
            <Link to="/login" className="btn-primary">Logowanie</Link>
            <Link to="/register" className="btn-secondary">Rejestracja</Link>
          </div>
        </nav>
      </header>

      <main className="main-hero">
        <h1>Witamy w aplikacji Finanse App</h1>
        <p>Śledź swoje przychody i wydatki, analizuj budżet i osiągaj cele finansowe.</p>

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2d89ef" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#2d89ef" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#2d89ef"
                strokeWidth={2}
                fill="url(#colorValue)"
                isAnimationActive={true}
                animationDuration={500}
                dot={false}
              />
              <Tooltip formatter={(v) => `${v.toFixed(2)} zł`} />
              <XAxis hide />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
}
