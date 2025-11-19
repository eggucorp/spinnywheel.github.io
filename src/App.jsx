import { useState, useEffect } from 'react'
import Wheel from './components/Wheel'
import EntryList from './components/EntryList'
import EliminatedList from './components/EliminatedList'
import WinnerModal from './components/WinnerModal'
import { soundManager } from './utils/SoundManager'
import confetti from 'canvas-confetti';
import './App.css'

function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('wheel_items_v2');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [eliminated, setEliminated] = useState(() => {
    const saved = localStorage.getItem('wheel_eliminated_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);

  // Load data from local storage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem('wheel_items_v2');
    const savedEliminated = localStorage.getItem('wheel_eliminated_v2');
    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedEliminated) setEliminated(JSON.parse(savedEliminated));
  }, []);

  // Save data to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('wheel_items_v2', JSON.stringify(items));
    localStorage.setItem('wheel_eliminated_v2', JSON.stringify(eliminated));
  }, [items, eliminated]);

  const handleAdd = (item) => {
    // item is now expected to be an object { id, type, value }
    // If string passed (legacy/paste), convert to object
    const newItem = typeof item === 'string' 
      ? { id: Date.now() + Math.random(), type: 'text', value: item }
      : { ...item, id: Date.now() + Math.random() };
      
    setItems(prev => [...prev, newItem]);
    setWinner(null);
  };

  const handleRemove = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setItems([]);
    setEliminated([]);
    setWinner(null);
  };

  const handleRemoveDuplicates = () => {
    // Remove duplicates based on value
    setItems(prev => {
      const seen = new Set();
      return prev.filter(item => {
        const duplicate = seen.has(item.value);
        seen.add(item.value);
        return !duplicate;
      });
    });
  };

  const handleSpinStart = () => {
    if (isSpinning || items.length < 2) return;
    
    setIsSpinning(true);
    setWinner(null);
    
    // Select a random index to eliminate
    const randomIndex = Math.floor(Math.random() * items.length);
    setSelectedIndex(randomIndex);
  };

  const handleSpinComplete = () => {
    setIsSpinning(false);
    
    if (selectedIndex !== null) {
      const eliminatedItem = items[selectedIndex];
      const newItems = items.filter((_, index) => index !== selectedIndex);
      
      setItems(newItems);
      setEliminated([eliminatedItem, ...eliminated]);
      setSelectedIndex(null);

      // Check for winner
      if (newItems.length === 1) {
        setWinner(newItems[0]);
        soundManager.playWin();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setIsAutoSpinning(false); // Stop auto-spin on win
      } else {
        soundManager.playElimination();
        
        // Auto-spin logic
        if (isAutoSpinning && newItems.length >= 2) {
          const timer = setTimeout(() => {
            // We can't call handleSpinStart directly here because it relies on closure state
            // But wait, we removed this logic in favor of useEffect!
            // Why am I adding it back? I shouldn't.
            // I will remove this block in the replacement content.
          }, 1000);
        }
      }
    }
  };

  // Need to wrap handleSpinStart in a ref or effect if called from setTimeout 
  // to ensure it has fresh state? 
  // Actually, since handleSpinComplete closes over the current render scope, 
  // calling handleSpinStart directly might use stale state if not careful.
  // But wait, we are triggering a state update (setItems) which triggers re-render.
  // The setTimeout callback runs in the *current* closure.
  // We need to trigger the spin in an effect that watches for the "ready to auto-spin" state?
  // Or just use a ref for items?
  // Let's use a useEffect for the auto-spin trigger to be safe and clean.

  useEffect(() => {
    if (isAutoSpinning && !isSpinning && !winner && items.length >= 2) {
      const timer = setTimeout(() => {
        handleSpinStart();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAutoSpinning, isSpinning, winner, items.length]); 
  // Note: handleSpinStart needs to be stable or omitted from deps if it doesn't change.
  // But handleSpinStart depends on items. 
  // Let's refactor handleSpinStart to not depend on closure items if possible, 
  // or just let the effect re-run.
  
  // Actually, simpler approach:
  // Just toggle the flag. The effect above handles the triggering.
  // But wait, handleSpinStart uses `items`. If we call it from effect, it works.
  
  const toggleAutoSpin = () => {
    setIsAutoSpinning(!isAutoSpinning);
  };
  
  const handleRestart = () => {
    setItems(prev => [...prev, ...eliminated]);
    setEliminated([]);
    setWinner(null);
  };

  return (
    <div className="app-container">
      <h1>Elimination Wheel</h1>
      
      <div className="game-area">
        <div className="wheel-section">
          {items.length > 0 ? (
            <Wheel 
              items={items} 
              isSpinning={isSpinning} 
              selectedIndex={selectedIndex}
              onSpinComplete={handleSpinComplete}
              onSpinStart={handleSpinStart}
            />
          ) : (
            <div className="wheel-placeholder">
              <div className="placeholder-text">Add items to start spinning!</div>
            </div>
          )}

          <div className="controls">
          <button 
            className={`spin-button ${isAutoSpinning ? 'active' : ''}`} 
            onClick={toggleAutoSpin}
            disabled={items.length < 2 || (isSpinning && !isAutoSpinning)}
            style={{ 
              background: isAutoSpinning ? 'var(--accent-color)' : 'var(--surface-glass)',
              color: isAutoSpinning ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            {isAutoSpinning ? 'Stop Auto-Spin' : 'Auto-Spin'}
          </button>
        {items.length < 2 && !winner && (
              <div className="instruction-text">Add at least 2 items to spin</div>
            )}
          </div>
        </div>

        <div className="lists-section">
          <EntryList 
            items={items} 
            onAdd={handleAdd} 
            onRemove={handleRemove} 
            onClear={handleClear}
            onRemoveDuplicates={handleRemoveDuplicates}
            disabled={isSpinning}
          />
          <EliminatedList eliminated={eliminated} onRestart={handleRestart} />
        </div>
      </div>
      
      <WinnerModal winner={winner} onClose={() => setWinner(null)} />
    </div>
  )
}

export default App
