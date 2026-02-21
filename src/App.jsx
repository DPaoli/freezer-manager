import React, { useState, useEffect } from 'react';
import './index.css';

const FREEZER_COUNT = 13;
const SLOTS_PER_FREEZER = 24;

const FREEZER_CONFIG = Array(FREEZER_COUNT).fill(null).map((_, i) => ({
  id: i,
  name: `Freezer ${i + 1}`,
  type: i === 0 ? 'Caixas' : 'Potes',
  cols: i === 0 ? 8 : 6,
  rows: i === 0 ? 3 : 4,
}));

function App() {
  const [activeFreezer, setActiveFreezer] = useState(0);
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('freezer_data_v2'); // New version for 24 slots
    if (saved) return JSON.parse(saved);
    return Array(FREEZER_COUNT).fill(null).map(() => Array(SLOTS_PER_FREEZER).fill(false));
  });

  useEffect(() => {
    localStorage.setItem('freezer_data_v2', JSON.stringify(data));
  }, [data]);

  const toggleSlot = (index) => {
    const newData = [...data];
    newData[activeFreezer] = [...newData[activeFreezer]];
    newData[activeFreezer][index] = !newData[activeFreezer][index];
    setData(newData);

    if (window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const clearCurrent = () => {
    if (window.confirm('Tem certeza que deseja limpar este freezer?')) {
      const newData = [...data];
      newData[activeFreezer] = Array(SLOTS_PER_FREEZER).fill(false);
      setData(newData);
    }
  };

  const getStats = () => {
    let potesCheios = 0;
    let potesVazios = 0;
    let caixasCheias = 0;
    let caixasVazias = 0;

    data.forEach((freezerData, i) => {
      const cheios = freezerData.filter(s => s).length;
      const vazios = SLOTS_PER_FREEZER - cheios;
      if (FREEZER_CONFIG[i].type === 'Potes') {
        potesCheios += cheios;
        potesVazios += vazios;
      } else {
        caixasCheias += cheios;
        caixasVazias += vazios;
      }
    });

    return { potesCheios, potesVazios, caixasCheias, caixasVazias };
  };

  const stats = getStats();
  const currentConfig = FREEZER_CONFIG[activeFreezer];

  return (
    <>
      <header>
        <div className="header-top">
          <h1>Freezers</h1>
          <button className="btn-clear" onClick={clearCurrent}>Limpar</button>
        </div>
        <div className="selector-container">
          <select
            value={activeFreezer}
            onChange={(e) => setActiveFreezer(Number(e.target.value))}
            className="freezer-select"
          >
            {FREEZER_CONFIG.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name} ({config.type})
              </option>
            ))}
          </select>
        </div>
      </header>

      <div
        className="grid-container"
        style={{ '--cols': currentConfig.cols, '--rows': currentConfig.rows }}
      >
        {data[activeFreezer].map((isFull, i) => (
          <button
            key={i}
            className={`slot ${isFull ? 'cheia' : 'vazia'}`}
            onClick={() => toggleSlot(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="stats-container">
        <div className="stats-group">
          <h3>Potes</h3>
          <div className="stats-row">
            <div className="stat-item blue">
              <span className="stat-value">{stats.potesCheios}</span>
              <span className="stat-label">Cheias</span>
            </div>
            <div className="stat-item red">
              <span className="stat-value">{stats.potesVazios}</span>
              <span className="stat-label">Vazias</span>
            </div>
          </div>
        </div>
        <div className="stats-group separator">
          <h3>Caixas</h3>
          <div className="stats-row">
            <div className="stat-item blue">
              <span className="stat-value">{stats.caixasCheias}</span>
              <span className="stat-label">Cheias</span>
            </div>
            <div className="stat-item red">
              <span className="stat-value">{stats.caixasVazias}</span>
              <span className="stat-label">Vazias</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
