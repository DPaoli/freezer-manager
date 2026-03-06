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
    const savedV4 = localStorage.getItem('freezer_data_v4');
    if (savedV4) return JSON.parse(savedV4);

    const savedV3 = localStorage.getItem('freezer_data_v3');
    const parsedV3 = savedV3 ? JSON.parse(savedV3) : null;

    const savedV2 = localStorage.getItem('freezer_data_v2');
    const parsedV2 = savedV2 ? JSON.parse(savedV2) : null;

    return FREEZER_CONFIG.map((config, i) => {
      let totalSlots = 24;
      if (config.type === 'Caixa') totalSlots = 54;
      if (config.type === 'Pote') totalSlots = 40;

      const slots = Array(totalSlots).fill(false);

      if (parsedV3 && parsedV3[i]) {
        for (let j = 0; j < Math.min(parsedV3[i].length, totalSlots); j++) {
          slots[j] = parsedV3[i][j];
        }
      } else if (parsedV2 && parsedV2[i]) {
        if (config.type === 'Caixa') {
          // Old data (24 slots) mapped to Parte de Baixo (indices 30 to 53)
          for (let j = 0; j < Math.min(parsedV2[i].length, 24); j++) {
            slots[j + 30] = parsedV2[i][j];
          }
        } else {
          for (let j = 0; j < Math.min(parsedV2[i].length, 24); j++) {
            slots[j] = parsedV2[i][j];
          }
        }
      }
      return slots;
    });
  });

  useEffect(() => {
    localStorage.setItem('freezer_data_v4', JSON.stringify(data));
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
      setData(FREEZER_CONFIG.map(config => {
        let totalSlots = 24;
        if (config.type === 'Caixa') totalSlots = 54;
        if (config.type === 'Pote') totalSlots = 40;
        return Array(totalSlots).fill(false);
      }));
    }
  };

  const generateReport = () => {
    let report = "*RELATÓRIO DE FREEZERES*\n\n";
    let potesTotal = 0;
    let caixasTotal = 0;

    data.forEach((freezerData, i) => {
      const config = FREEZER_CONFIG[i];
      const cheios = freezerData.filter(s => s).length;

      if (config.type === 'Metade') {
        const pCheios = freezerData.slice(0, 12).filter(s => s).length;
        const pVazios = 12 - pCheios;
        const cCheios = freezerData.slice(12, 24).filter(s => s).length;
        const cVazios = 12 - cCheios;
        report += `*${config.name}*:\n  - Potes: ${pCheios} cheios, ${pVazios} vazios\n  - Caixas: ${cCheios} cheias, ${cVazios} vazias\n`;
        potesTotal += pCheios;
        caixasTotal += cCheios;
      } else if (config.type === 'Caixa') {
        const total = 54;
        const vazios = total - cheios;
        report += `*${config.name}* (${config.type}): ${cheios} cheias, ${vazios} vazias\n`;
        caixasTotal += cheios;
      } else if (config.type === 'Pote') {
        const total = 40;
        const vazios = total - cheios;
        report += `*${config.name}* (${config.type}): ${cheios} cheios, ${vazios} vazios\n`;
        potesTotal += cheios;
      } else {
        const total = 24;
        const vazios = total - cheios;
        const labelCheio = config.type === 'Pote' ? 'cheios' : 'cheias';
        const labelVazio = config.type === 'Pote' ? 'vazios' : 'vazias';
        report += `*${config.name}* (${config.type}): ${cheios} ${labelCheio}, ${vazios} ${labelVazio}\n`;
        potesTotal += cheios;
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
      } else if (config.type === 'Caixa') {
        const total = 54;
        const cheios = freezerData.filter(s => s).length;
        caixasCheias += cheios;
        caixasVazias += (total - cheios);
      } else if (config.type === 'Pote') {
        const total = 40;
        const cheios = freezerData.filter(s => s).length;
        potesCheios += cheios;
        potesVazios += (total - cheios);
      } else {
        const total = 24;
        const cheios = freezerData.filter(s => s).length;
        if (config.type === 'Pote') {
          potesCheios += cheios;
          potesVazios += (total - cheios);
        } else {
          caixasCheias += cheios;
          caixasVazias += (total - cheios);
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

      {currentConfig.type === 'Caixa' ? (
        <div className="caixa-layout">
          <h2 className="section-title">Parte de Cima</h2>
          <div
            className="grid-container"
            style={{ '--cols': 10, '--rows': 3 }}
          >
            {data[activeFreezer].slice(0, 30).map((isFull, idx) => {
              const actualIndex = idx;
              return (
                <button
                  key={actualIndex}
                  className={`slot ${isFull ? 'cheia' : 'vazia'}`}
                  onClick={() => toggleSlot(actualIndex)}
                >
                  {actualIndex + 1}
                </button>
              );
            })}
          </div>

          <h2 className="section-title">Parte de Baixo</h2>
          <div
            className="grid-container"
            style={{ '--cols': currentConfig.cols, '--rows': currentConfig.rows }}
          >
            {data[activeFreezer].slice(30, 54).map((isFull, idx) => {
              const actualIndex = idx + 30;
              return (
                <button
                  key={actualIndex}
                  className={`slot ${isFull ? 'cheia' : 'vazia'}`}
                  onClick={() => toggleSlot(actualIndex)}
                >
                  {actualIndex + 1}
                </button>
              );
            })}
          </div>
        </div>
      ) : currentConfig.type === 'Pote' ? (
        <div className="caixa-layout">
          <h2 className="section-title">Principal</h2>
          <div
            className="grid-container"
            style={{ '--cols': currentConfig.cols, '--rows': currentConfig.rows }}
          >
            {data[activeFreezer].slice(0, 24).map((isFull, idx) => {
              const actualIndex = idx;
              return (
                <button
                  key={actualIndex}
                  className={`slot ${isFull ? 'cheia' : 'vazia'}`}
                  onClick={() => toggleSlot(actualIndex)}
                >
                  {actualIndex + 1}
                </button>
              );
            })}
          </div>

          <h2 className="section-title">Motor</h2>
          <div
            className="grid-container"
            style={{ '--cols': 8, '--rows': 2 }}
          >
            {data[activeFreezer].slice(24, 40).map((isFull, idx) => {
              const actualIndex = idx + 24;
              return (
                <button
                  key={actualIndex}
                  className={`slot ${isFull ? 'cheia' : 'vazia'}`}
                  onClick={() => toggleSlot(actualIndex)}
                >
                  {actualIndex + 1}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
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
      )}

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
