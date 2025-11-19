import { useEffect } from 'react';
import styles from './WinnerModal.module.css';

export default function WinnerModal({ winner, onClose }) {
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Close modal on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!winner) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.content}>
          <div className={styles.icon}>🎉</div>
          <h2 className={styles.title}>Winner!</h2>
          
          <div className={styles.winnerDisplay}>
            {winner.type === 'image' ? (
              <img 
                src={winner.value} 
                alt="Winner" 
                className={styles.winnerImage}
              />
            ) : (
              <div className={styles.winnerText}>{winner.value}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
