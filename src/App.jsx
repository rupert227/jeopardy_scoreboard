import React, { useState, useEffect, useRef } from 'react';

const Window = ({ titleValue, onTitleChange, titleClass = "", children, className = "", onClick, isClosing = false }) => (
  <div className={`window ${className} ${isClosing ? 'closing' : ''}`} onClick={onClick}>
    <div className={`window-title-bar ${titleClass ? 'has-team-color' : ''} ${titleClass}`}>
      {onTitleChange ? (
        <input 
          className="title-bar-input"
          value={titleValue} 
          onChange={(e) => onTitleChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="title-bar-input" style={{display: 'inline-block'}}>{titleValue}</span>
      )}
      <div className="win-button" style={{width: '18px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', padding: '0'}}>x</div>
    </div>
    <div className="window-content" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const ResultsScreen = ({ teams }) => {
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  
  useEffect(() => {
    // Continuous confetti
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      confetti({ 
        ...defaults, 
        particleCount: 40, 
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
      });
      confetti({ 
        ...defaults, 
        particleCount: 40, 
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="results-container">
      <header style={{textAlign: 'center', marginBottom: '1vh'}}>
        <h1 style={{fontSize: '42px', color: 'white', textShadow: '4px 4px black', margin: 0}}>FINAL RANKINGS</h1>
      </header>
      {sortedTeams.map((team, index) => (
        <div 
          key={team.id} 
          className="result-row" 
          style={{ animationDelay: `${index * 0.2}s` }}
        >
          <div className="result-rank">#{index + 1}</div>
          <div className="result-name">{team.name}</div>
          <div className={`result-score ${team.score > 0 ? 'score-pos' : team.score < 0 ? 'score-neg' : ''}`}>
            ${team.score}
          </div>
        </div>
      ))}
    </div>
  );
};

function App() {
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('jeopardyWin95FinalRank');
    if (saved) return JSON.parse(saved);
    return Array.from({ length: 9 }, (_, i) => ({
      id: i,
      name: `Table ${i + 1}`,
      score: 0
    }));
  });

  const [activeTeamId, setActiveTeamId] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [lastChange, setLastChange] = useState(null);
  const pulseTimeout = useRef(null);
  const lastRPress = useRef(0);

  useEffect(() => {
    localStorage.setItem('jeopardyWin95FinalRank', JSON.stringify(teams));
  }, [teams]);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setActiveTeamId(null);
      setIsClosing(false);
    }, 200);
  };

  const resetScores = (immediate = false) => {
    if (immediate || window.confirm("Are you sure you want to reset all scores to $0?")) {
      setTeams(prev => prev.map(team => ({ ...team, score: 0 })));
      setIsGameOver(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT') return;

      const key = e.key.toLowerCase();

      // Shortcut: 'rr' for Reset/Restart
      if (key === 'r') {
        const now = Date.now();
        if (now - lastRPress.current < 500) {
          if (isGameOver) {
            window.location.reload();
          } else {
            resetScores(true);
          }
        }
        lastRPress.current = now;
      }

      // Shortcut: 'e' for End Game
      if (key === 'e' && !isGameOver && activeTeamId === null) {
        setIsGameOver(true);
      }

      if (isGameOver) return;
      
      if (e.key >= '1' && e.key <= '9' && activeTeamId === null) {
        setActiveTeamId(parseInt(e.key) - 1);
      }

      if (e.key === 'Escape' && activeTeamId !== null) {
        closeModal();
      }

      if (activeTeamId !== null) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          updateScore(activeTeamId, 100);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          updateScore(activeTeamId, -100);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTeamId, isGameOver]);

  const updateScore = (id, amount) => {
    setTeams(prev => prev.map(team => 
      team.id === id ? { ...team, score: team.score + amount } : team
    ));
    setLastChange(amount > 0 ? 'pos' : 'neg');
    if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
    pulseTimeout.current = setTimeout(() => setLastChange(null), 400);
  };

  const updateName = (id, newName) => {
    setTeams(prev => prev.map(team => 
      team.id === id ? { ...team, name: newName } : team
    ));
  };

  const activeTeam = activeTeamId !== null ? teams[activeTeamId] : null;

  return (
    <div className="desktop">
      {isGameOver ? (
        <ResultsScreen teams={teams} />
      ) : (
        <>
          <div className="scoreboard-grid">
            {teams.map((team, index) => (
              <Window 
                key={team.id} 
                titleValue={team.name}
                onTitleChange={(val) => updateName(team.id, val)}
                titleClass={`team-color-${index}`}
                className="team-window"
                onClick={() => setActiveTeamId(team.id)}
              >
                <div className="score-text">
                  ${team.score}
                </div>
              </Window>
            ))}
          </div>

          {activeTeam && (
            <div className={`overlay ${isClosing ? 'closing' : ''}`} onClick={closeModal}>
              <Window 
                titleValue={`Scoring - ${activeTeam.name}`} 
                titleClass={`team-color-${activeTeamId}`}
                className="modal-window"
                isClosing={isClosing}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content">
                  <div className="modal-title" style={{fontFamily: 'Segoe UI, Tahoma, sans-serif'}}>{activeTeam.name}</div>
                  <div className={`modal-score ${lastChange === 'pos' ? 'score-pulse-pos' : lastChange === 'neg' ? 'score-pulse-neg' : ''}`}>
                    ${activeTeam.score}
                  </div>
                  
                  <div className="modal-controls">
                    <button className="big-win-button" onClick={() => updateScore(activeTeamId, -100)}>
                      -100
                    </button>
                    <button className="big-win-button" onClick={() => updateScore(activeTeamId, 100)}>
                      +100
                    </button>
                  </div>
                </div>
              </Window>
            </div>
          )}
        </>
      )}
      
      <div className="taskbar">
        <div className="taskbar-controls">
          {isGameOver ? (
            <button className="win-button" style={{fontWeight: 'bold', padding: '0 30px', height: '40px'}} onClick={() => window.location.reload()}>
              Restart (rr)
            </button>
          ) : (
            <>
              <button className="win-button" style={{fontWeight: 'bold', padding: '0 30px', height: '40px'}} onClick={() => resetScores(false)}>
                Reset (rr)
              </button>
              <button className="win-button" style={{fontWeight: 'bold', padding: '0 30px', height: '40px'}} onClick={() => setIsGameOver(true)}>
                End (e)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
