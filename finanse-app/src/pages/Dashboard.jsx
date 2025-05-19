import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'all');
  const [transactions, setTransactions] = useState([]);

  const previousBalance = useRef(0);
  const notifiedMilestones = useRef(new Set());
  const [incomeMilestones, setIncomeMilestones] = useState([]);
  const [expenseMilestones, setExpenseMilestones] = useState([]);
  const [balanceMilestones, setBalanceMilestones] = useState([]);
  const [balanceMilestonesText, setBalanceMilestonesText] = useState('');
  const [incomeMilestonesText, setIncomeMilestonesText] = useState('');
  const [expenseMilestonesText, setExpenseMilestonesText] = useState('');
  const [balanceGoal, setBalanceGoal] = useState(null);

  const [reportRange, setReportRange] = useState(() => localStorage.getItem('reportRange') || 'month');
  const [reportType, setReportType] = useState(() => localStorage.getItem('reportType') || 'summary');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [reportResult, setReportResult] = useState(null);

  const filteredTransactions = transactions.filter(t =>
    activeTab === 'all' ? true : t.type === activeTab
  );

  const chartData = [];
  let runningBalance = 0;
  [...transactions]
    .sort((a, b) => new Date(a.date) - new Date(b.date)).reverse()
    .forEach((t, index) => {
      runningBalance += t.type === 'income' ? t.amount : -t.amount;
      chartData.push({
        name: `#${index + 1}`,
        value: runningBalance,
        label: t.date
      });
    });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.username) {
      setUsername(user.username);
      fetch(`http://localhost:5000/api/transactions/${user.username}`)
        .then(res => res.json())
        .then(data => setTransactions(data))
        .catch(err => console.error('Błąd pobierania danych:', err));

      const cached = localStorage.getItem('budgetSettings');
      if (cached) {
        const data = JSON.parse(cached);
        setBalanceGoal(data.balanceGoal || null);
        setBalanceMilestones(data.balanceMilestones || []);
        setBalanceMilestonesText((data.balanceMilestones || []).join(','));
        setIncomeMilestones(data.incomeMilestones || []);
        setIncomeMilestonesText((data.incomeMilestones || []).join(','));
        setExpenseMilestones(data.expenseMilestones || []);
        setExpenseMilestonesText((data.expenseMilestones || []).join(','));
      }

      fetch(`http://localhost:5000/api/budget-settings/${user.username}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setBalanceGoal(data.balanceGoal || null);

            setBalanceMilestones(data.balanceMilestones || []);
            setBalanceMilestonesText((data.balanceMilestones || []).join(','));

            setIncomeMilestones(data.incomeMilestones || []);
            setIncomeMilestonesText((data.incomeMilestones || []).join(','));

            setExpenseMilestones(data.expenseMilestones || []);
            setExpenseMilestonesText((data.expenseMilestones || []).join(','));

            const { _id, username, __v, ...dataWithoutId } = data;
            localStorage.setItem('budgetSettings', JSON.stringify(dataWithoutId));
          }
        })
        .catch(err => console.error('Błąd pobierania ustawień budżetu:', err));

      const last = localStorage.getItem('lastReportSettings');
      if (last) {
        const data = JSON.parse(last);
        setReportRange(data.reportRange || 'month');
        setReportType(data.reportType || 'summary');
        setCustomFrom(data.customFrom || '');
        setCustomTo(data.customTo || '');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const toggleAddOptions = () => {
    setShowOptions(!showOptions);
    setSelectedType('');
    setAmount('');
  };

  const selectType = (type) => {
    setSelectedType(type);
  };

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = (title, body) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/assets/icon-192.png'
      });
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  useEffect(() => {
    const prev = previousBalance.current;

    if (prev < 0 && balance > 0) {
      sendNotification('Saldo dodatnie!', 'Saldo przeszło z ujemnego na dodatnie.');
      previousBalance.current = balance;
      return;
    }

    if (prev > 0 && balance < 0) {
      sendNotification('Saldo ujemne!', 'Saldo przeszło z dodatniego na ujemne.');
      previousBalance.current = balance;
      return;
    }

    for (let milestone of balanceMilestones) {
      if ((milestone >= 0 && balance >= milestone) || (milestone < 0 && balance <= milestone) && !notifiedMilestones.current.has('b' + milestone)) {
        sendNotification('Saldo', `Saldo przekroczyło ${milestone} zł.`);
        notifiedMilestones.current.add('b' + milestone);
        break;
      }
    }
    for (let milestone of incomeMilestones) {
      if (totalIncome >= milestone && !notifiedMilestones.current.has('i' + milestone)) {
        sendNotification('Przychody', `Przychody przekroczyły ${milestone} zł.`);
        notifiedMilestones.current.add('i' + milestone);
        break;
      }
    }
    for (let milestone of expenseMilestones) {
      if (totalExpense >= milestone && !notifiedMilestones.current.has('e' + milestone)) {
        sendNotification('Wydatki', `Wydatki przekroczyły ${milestone} zł.`);
        notifiedMilestones.current.add('e' + milestone);
        break;
      }
    }

    previousBalance.current = balance;
  }, [transactions]);

  const submitTransaction = async () => {
    if (!amount || !selectedType || parseFloat(amount) < 1) return;

    const newTransaction = {
      id: Date.now(),
      type: selectedType,
      amount: parseFloat(amount),
      date: new Date().toLocaleString('pl-PL')
    };

    setTransactions([newTransaction, ...transactions]);

    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.username) {
      try {
        await fetch('http://localhost:5000/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username,
            type: newTransaction.type,
            amount: newTransaction.amount,
            date: newTransaction.date
          })
        });
      } catch (err) {
        console.error('Błąd zapisu do MongoDB:', err);
      }
    }

    setAmount('');
    setSelectedType('');
    setShowOptions(false);
  };

  const handleSaveBudgetSettings = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.username) return;

    const settings = {
      username: user.username,
      balanceGoal,
      balanceMilestones,
      incomeMilestones,
      expenseMilestones
    };

    try {
      await fetch('http://localhost:5000/api/budget-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const { username, ...dataWithoutId } = settings;
      localStorage.setItem('budgetSettings', JSON.stringify(dataWithoutId));
      sendNotification('Zapisano', 'Ustawienia budżetowe zostały zapisane.');
    } catch (err) {
      console.error('Błąd zapisu ustawień:', err);
    }
  };

  function parsePLDate(str) {
    const [datePart, timePart] = str.split(',').map(s => s.trim());
    const [day, month, year] = datePart.split('.').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  const generateReport = () => {
    let fromDate;
    let toDate = new Date();

    switch (reportRange) {
      case 'week':
        fromDate = new Date(toDate);
        fromDate.setDate(toDate.getDate() - 7);
        break;
      case 'month':
        fromDate = new Date(toDate);
        fromDate.setMonth(toDate.getMonth() - 1);
        break;
      case 'year':
        fromDate = new Date(toDate);
        fromDate.setFullYear(toDate.getFullYear() - 1);
        break;
      case 'custom':
        if (!customFrom || !customTo) return;
        fromDate = new Date(customFrom);
        toDate = new Date(customTo);
        break;
      default:
        return;
    }

    const filtered = transactions
      .filter(t => {
        const tDate = parsePLDate(t.date);
        return tDate >= fromDate && tDate <= toDate;
      })
      .sort((a, b) => parsePLDate(a.date) - parsePLDate(b.date));

    let result;

    const incomes = filtered.filter(t => t.type === 'income');
    const expenses = filtered.filter(t => t.type === 'expense');
    switch (reportType) {
      case 'summary':
        const income = incomes.reduce((s, t) => s + t.amount, 0);
        const expense = expenses.reduce((s, t) => s + t.amount, 0);
        const avgIncome = incomes.length ? income / incomes.length : 0;
        const avgExpense = expenses.length ? expense / expenses.length : 0;
        const totalDays = Math.max(1, Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)));
        const mostCommonType = incomes.length === expenses.length
          ? 'Równowaga'
          : incomes.length > expenses.length ? 'Przychody' : 'Wydatki';
        const savingsRate = income > 0 ? (((income - expense) / income) * 100).toFixed(2) : '0.00';

        result = {
          "Zakres dat": `${fromDate.toLocaleDateString('pl-PL')} – ${toDate.toLocaleDateString('pl-PL')}`,
          "Saldo": `${(income - expense).toFixed(2)} zł`,
          "Wskaźnik oszczędności": `${savingsRate}%`,
          "Liczba transakcji": filtered.length,
          "Średnia liczba transakcji dziennie": (filtered.length / totalDays).toFixed(2),

          "Przychody – suma": `${income.toFixed(2)} zł`,
          "Liczba przychodów": incomes.length,
          "Średni przychód": `${avgIncome.toFixed(2)} zł`,
          "Największy przychód": incomes.length ? `${Math.max(...incomes.map(t => t.amount)).toFixed(2)} zł` : '–',

          "Wydatki – suma": `${expense.toFixed(2)} zł`,
          "Liczba wydatków": expenses.length,
          "Średni wydatek": `${avgExpense.toFixed(2)} zł`,
          "Największy wydatek": expenses.length ? `${Math.max(...expenses.map(t => t.amount)).toFixed(2)} zł` : '–',

          "Dominujący typ transakcji": mostCommonType
        };
        break;

      case 'incomeVsExpense':
        const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
        const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);

        result = {
          "Zakres dat": `${fromDate.toLocaleDateString('pl-PL')} – ${toDate.toLocaleDateString('pl-PL')}`,
          "Łączne przychody": `${totalIncome.toFixed(2)} zł`,
          "Liczba przychodów": incomes.length,
          "Średni przychód": incomes.length ? `${(totalIncome / incomes.length).toFixed(2)} zł` : '0.00 zł',
          "Największy przychód": incomes.length ? `${Math.max(...incomes.map(t => t.amount)).toFixed(2)} zł` : '–',
          "Łączne wydatki": `${totalExpense.toFixed(2)} zł`,
          "Liczba wydatków": expenses.length,
          "Średni wydatek": expenses.length ? `${(totalExpense / expenses.length).toFixed(2)} zł` : '0.00 zł',
          "Największy wydatek": expenses.length ? `${Math.max(...expenses.map(t => t.amount)).toFixed(2)} zł` : '–',
          "Udział wydatków w przychodach": totalIncome > 0 ? `${((totalExpense / totalIncome) * 100).toFixed(2)}%` : '–'
        };
        break;

      case 'balance':
        let running = 0;
        result = filtered.map(t => {
          const saldoPrzed = running;
          running += t.type === 'income' ? t.amount : -t.amount;
          return {
            "Data": t.date,
            "Rodzaj transakcji": t.type === 'income' ? 'Przychód' : 'Wydatek',
            "Kwota": `${t.amount.toFixed(2)} zł`,
            "Saldo przed transakcją": `${saldoPrzed.toFixed(2)} zł`,
            "Saldo po transakcji": `${running.toFixed(2)} zł`
          };
        }).reverse();
        break;

      default:
        result = { info: "Brak danych" };
    }

    localStorage.setItem('lastReportSettings', JSON.stringify({
      reportRange,
      reportType,
      customFrom,
      customTo
    }));

    setReportResult(result);
  };

  const renderReportResult = () => {
    if (!reportResult) return null;

    if (Array.isArray(reportResult)) {
      return (
        <table className="report-table">
          <thead>
            <tr>
              {Object.keys(reportResult[0] || {}).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportResult.map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((val, i) => (
                  <td key={i}>{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <ul className="report-list">
        {Object.entries(reportResult).map(([key, value]) => (
          <li key={key}>
            <strong>{key}:</strong>{' '}
            {Array.isArray(value) ? (
              <ul>
                {value.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            ) : (
              <span>{value}</span>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Czy na pewno chcesz się wylogować?');
    if (confirmed) {
      localStorage.clear();
      navigate('/');
    }
  };

  const handleClearTransactions = async () => {
    const confirmed = window.confirm('Czy na pewno chcesz usunąć wszystkie transakcje?');
    if (!confirmed) return;

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.username) return;

    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${user.username}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setTransactions([]);
        sendNotification('Transakcje usunięte', 'Wszystkie Twoje transakcje zostały wyczyszczone.');
      } else {
        console.error('Błąd podczas usuwania transakcji');
      }
    } catch (err) {
      console.error('Błąd połączenia z serwerem:', err);
    }
  };

  const renderSummary = () => {
    if (activeTab === 'income') {
      return (
        <p className="summary">
          Suma przychodów: <span className="text-green">+{totalIncome.toFixed(2)} zł</span>
        </p>
      );
    }
    if (activeTab === 'expense') {
      return (
        <p className="summary">
          Suma wydatków: <span className="text-red">-{totalExpense.toFixed(2)} zł</span>
        </p>
      );
    }
    if (activeTab === 'analysis') {
      return (
        <div className="analysis-tab">
          <h3 className="summary">Historia salda</h3>
          <div className="chart-wrapper styled-chart">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2d89ef" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2d89ef" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#eee" />

                <XAxis
                  dataKey="label"
                  angle={-30}
                  textAnchor="end"
                  height={80}
                  interval="preserveStartEnd"
                  tickFormatter={(label) => label.split(',')[0]}
                  label={{
                    value: 'Data transakcji',
                    position: 'insideBottom',
                    offset: -5,
                    style: { fill: '#333', fontSize: 14 }
                  }}
                />

                <YAxis
                  label={{
                    value: 'Kwota (zł)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: -5,
                    style: { fill: '#333', fontSize: 14 }
                  }}
                />

                <Tooltip formatter={(v) => `${v.toFixed(2)} zł`} />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2d89ef"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                  dot={false}
                />

                {balanceGoal && (
                  <ReferenceLine
                    y={balanceGoal}
                    stroke="green"
                    strokeDasharray="3 3"
                    label={{
                      position: 'right',
                      value: `Cel`,
                      fill: 'green',
                      fontSize: 13
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    if (activeTab === 'budget') {
      return (
        <div className="budget-settings">
          <div>
            <label>Cel stanu salda (zł):</label>
            <input
              type="number"
              value={balanceGoal || ''}
              onChange={(e) => setBalanceGoal(parseFloat(e.target.value) || null)}
            />
          </div>

          <div>
            <label>Progi powiadomień o stanie salda:</label>
            <input
              type="text"
              value={balanceMilestonesText}
              onChange={(e) => setBalanceMilestonesText(e.target.value)}
              placeholder="np. 10000,50000,100000"
              onBlur={(e) =>
                setBalanceMilestones(
                  e.target.value
                    .split(',')
                    .map(v => parseFloat(v))
                    .filter(v => !isNaN(v))
                    .slice(0, 3)
                )
              }
            />
            <div className="field-note">Maksymalnie 3 wartości oddzielone przecinkami</div>
          </div>

          <div>
            <label>Progi powiadomień o przychodach:</label>
            <input
              type="text"
              value={incomeMilestonesText}
              onChange={(e) => setIncomeMilestonesText(e.target.value)}
              placeholder="np. 5000,25000,100000"
              onBlur={(e) =>
                setIncomeMilestones(
                  e.target.value
                    .split(',')
                    .map(v => parseFloat(v))
                    .filter(v => !isNaN(v))
                    .slice(0, 3)
                )
              }
            />
            <div className="field-note">Maksymalnie 3 wartości oddzielone przecinkami</div>
          </div>

          <div>
            <label>Progi powiadomień o wydatkach:</label>
            <input
              type="text"
              value={expenseMilestonesText}
              onChange={(e) => setExpenseMilestonesText(e.target.value)}
              placeholder="np. 2000,10000,50000"
              onBlur={(e) =>
                setExpenseMilestones(
                  e.target.value
                    .split(',')
                    .map(v => parseFloat(v))
                    .filter(v => !isNaN(v))
                    .slice(0, 3)
                )
              }
            />
            <div className="field-note">Maksymalnie 3 wartości oddzielone przecinkami</div>
          </div>
          <div className="add-button-wrapper">
            <button className="btn-primary" id="saveBtn" onClick={handleSaveBudgetSettings}>
              Zapisz ustawienia
            </button>
          </div>
        </div>
      );
    }
    if (activeTab === 'report') {
      return (
        <div className="report-settings">
          <div>
            <label>Rodzaj raportu:</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="summary">Podsumowanie</option>
              <option value="incomeVsExpense">Przychody/wydatki</option>
              <option value="balance">Historia salda</option>
            </select>
          </div>

          <div>
            <label>Zakres czasowy:</label>
            <select value={reportRange} onChange={(e) => setReportRange(e.target.value)}>
              <option value="week">Ostatni tydzień</option>
              <option value="month">Ostatni miesiąc</option>
              <option value="year">Ostatni rok</option>
              <option value="custom">Własny zakres</option>
            </select>
          </div>

          {reportRange === 'custom' && (
            <div className="custom-range">
              <div>
                <label>Od:</label>
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              </div>
              <div>
                <label>Do:</label>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            </div>
          )}

          <div className="add-button-wrapper">
            <button className="btn-primary" onClick={generateReport}>Generuj</button>
          </div>

          {reportResult && (
            <div className="report-output">
              {renderReportResult()}
            </div>
          )}
        </div>
      );
    }
    return (
      <p className="summary">
        Saldo: <span className={balance >= 0 ? 'text-green' : 'text-red'}>
          {balance.toFixed(2)} zł
        </span>
        {balanceGoal && (
          <span style={{ marginLeft: '5px', fontSize: '0.95rem', color: '#555' }}>
            (Cel: {balanceGoal} zł)
          </span>
        )}
      </p>
    );
  };

  return (
    <div>
      <header className="header">
        <nav className="nav">
          <div className="nav-logo">
            <img src="/assets/icon-192.png" alt="Logo" className="logo-image" />
            Finanse App
          </div>
          <div className="nav-links">
            <button className="btn-primary" onClick={handleLogout}>
              Wyloguj
            </button>
            <button className="btn-secondary" id="clearBtn" onClick={handleClearTransactions}>
              Wyczyść transakcje
            </button>
          </div>
        </nav>
      </header>

      <main className="dashboard-container">
        <h2 className="dashboard-title">
          Twoje finanse{username && `, ${username}`}
        </h2>

        <div className="add-button-wrapper">
          <button id="addBtn" className="btn-success" onClick={toggleAddOptions}>
            Dodaj nowe
          </button>
        </div>

        {showOptions && (
          <div className="add-options">
            <div className="add-type-buttons">
              <div className="type-wrapper">
                <button
                  onClick={() => selectType('income')}
                  className={`btn-option income ${selectedType === 'income' ? 'selected' : ''}`}
                >
                  Przychód
                </button>
                {selectedType === 'income' && (
                  <div className="amount-form">
                    <input
                      type="number"
                      min="1"
                      placeholder="Wpisz kwotę (zł)"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <button onClick={submitTransaction} className="btn-submit">Dodaj</button>
                  </div>
                )}
              </div>

              <div className="type-wrapper">
                <button
                  onClick={() => selectType('expense')}
                  className={`btn-option expense ${selectedType === 'expense' ? 'selected' : ''}`}
                >
                  Wydatek
                </button>
                {selectedType === 'expense' && (
                  <div className="amount-form">
                    <input
                      type="number"
                      min="1"
                      placeholder="Wpisz kwotę (zł)"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <button onClick={submitTransaction} className="btn-submit">Dodaj</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <nav className="tabs">
          <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            Saldo
          </button>
          <button className={`tab-btn ${activeTab === 'income' ? 'active' : ''}`} onClick={() => setActiveTab('income')}>
            Przychody
          </button>
          <button className={`tab-btn ${activeTab === 'expense' ? 'active' : ''}`} onClick={() => setActiveTab('expense')}>
            Wydatki
          </button>
          <button className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
            Analiza
          </button>
          <button className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => setActiveTab('budget')}>
            Budżetowanie
          </button>
          <button className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>
            Raporty
          </button>
        </nav>

        <div className="summary-wrapper">
          {renderSummary()}
        </div>

        <section id="transactionList" className="transaction-list">
          {['all', 'income', 'expense'].includes(activeTab) && (
            filteredTransactions.length === 0 ? (
              <p>Brak transakcji</p>
            ) : (
              filteredTransactions.map((t) => (
                <div key={t._id || t.id} className={`transaction-item ${t.type}`}>
                  <span>
                    {t.type === 'income' ? '+ ' : '- '} {t.amount.toFixed(2)} zł
                  </span>
                  <span className="transaction-date">{t.date}</span>
                </div>
              ))
            )
          )}
        </section>
      </main>
    </div>
  );
}
