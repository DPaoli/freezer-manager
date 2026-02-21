import React, { useState, useEffect } from 'react';
import './index.css';

const FREEZER_COUNT = 13;
const SLOTS_PER_FREEZER = 24;

const FREEZER_CONFIG = [
  { name: "Disney 1", type: "Caixa", cols: 8, rows: 3 },
  { name: "Disney 2", type: "Caixa", cols: 8, rows: 3 },
  { name: "Zero", type: "Caixa", cols: 8, rows: 3 },
  { name: "HK/Festa", type: "Metade", cols: 6, rows: 4 }, // 12 Potes + 12 Caixas
  { name: "Frutos", type: "Caixa", cols: 8, rows: 3 },
  { name: "Potes Tradicionais", type: "Pote", cols: 6, rows: 4 },
  { name: "Cones/Açai/TopS", type: "Caixa", cols: 8, rows: 3 },
  { name: "Duetto", type: "Pote", cols: 6, rows: 4 },
  { name: "Delicia", type: "Caixa", cols: 8, rows: 3 },
  { name: "Seleções", type: "Pote", cols: 6, rows: 4 },
  { name: "Fazenda", type: "Caixa", cols: 8, rows: 3 },
  { name: "Netflix", type: "Caixa", cols: 8, rows: 3 },
  { name: "Sensa", type: "Caixa", cols: 8, rows: 3 },
].map((item, i) => ({ ...item, id: i }));

function App() {
  const [activeFreezer, setActiveFreezer] = useState(0);
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('freezer_data_v2');
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

  const clearAll = () => {
    if (window.confirm('ATENÇÃO: Isso irá zerar TODOS os freezeres. Prosseguir?')) {
      setData(Array(FREEZER_COUNT).fill(null).map(() => Array(SLOTS_PER_FREEZER).fill(false)));
    }
  };

  const generateReport = () => {
    let report = "*RELATÓRIO DE FREEZERES*\n\n";
    let potesTotal = 0;
    let caixasTotal = 0;

    data.forEach((freezerData, i) => {
      const config = FREEZER_CONFIG[i];
      const cheios = freezerData.filter(s => s).length;

      if (cheios > 0) {
        if (config.type === 'Metade') {
          const potesPart = freezerData.slice(0, 12).filter(s => s).length;
          const caixasPart = freezerData.slice(12, 24).filter(s => s).length;
          report += `*${config.name}*: ${potesPart} Potes / ${caixasPart} Caixas\n`;
          potesTotal += potesPart;
          caixasTotal += caixasPart;
        } else {
          report += `*${config.name}* (${config.type}): ${cheios} cheios\n`;
          if (config.type === 'Pote') potesTotal += cheios;
          else caixasTotal += cheios;
        }
      }
    });

    report += `\n*RESUMO TOTAL:*`;
    report += `\nPotes Cheios: ${potesTotal}`;
    report += `\nCaixas Cheias: ${caixasTotal}`;

    return encodeURIComponent(report);
  };

  const handleWhatsApp = () => {
    const message = generateReport();
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const getStats = () => {
    let potesCheios = 0;
    let potesVazios = 0;
    let caixasCheias = 0;
    let caixasVazias = 0;

    data.forEach((freezerData, i) => {
      const config = FREEZER_CONFIG[i];
      if (config.type === 'Metade') {
        const pCheios = freezerData.slice(0, 12).filter(s => s).length;
        const cCheios = freezerData.slice(12, 24).filter(s => s).length;
        potesCheios += pCheios;
        potesVazios += (12 - pCheios);
        caixasCheias += cCheios;
        caixasVazias += (12 - cCheios);
      } else {
        const cheios = freezerData.filter(s => s).length;
        const vazios = SLOTS_PER_FREEZER - cheios;
        if (config.type === 'Pote') {
          potesCheios += cheios;
          potesVazios += vazios;
        } else {
          caixasCheias += cheios;
          caixasVazias += vazios;
        }
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
          <h1>Freezer App</h1>
          <div className="header-btns">
            <button className="btn-clear secondary" onClick={clearAll}>Limpar Tudo</button>
            <button className="btn-report" onClick={handleWhatsApp}>Relatório</button>
          </div>
        </div>
        <div className="selector-container">
          <select
            value={activeFreezer}
            onChange={(e) => setActiveFreezer(Number(e.target.value))}
            className="freezer-select"
          >
            {FREEZER_CONFIG.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name} ({config.type === "Metade" ? "Pote/Caixa" : config.type})
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
            className={`slot ${isFull ? 'cheia' : 'vazia'} ${currentConfig.type === 'Metade' ? (i < 12 ? 'pote-zone' : 'caixa-zone') : ''}`}
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
