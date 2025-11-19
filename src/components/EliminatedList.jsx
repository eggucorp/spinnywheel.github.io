import { useState } from 'react';
import styles from './EliminatedList.module.css';

export default function EliminatedList({ eliminated, onRestart }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = eliminated.map((item, i) => `${eliminated.length - i}. ${item.value || 'Image'}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (eliminated.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Eliminated ({eliminated.length})</h3>
        <div className={styles.actions}>
          <button onClick={onRestart} className={styles.restartButton}>
            Restart
          </button>
          <button onClick={handleCopy} className={styles.copyButton}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div className={styles.list}>
        {eliminated.map((item, index) => (
          <div key={`${item.id || index}`} className={styles.item}>
            <span className={styles.number}>{eliminated.length - index}.</span>
            {item.type === 'image' ? (
              <img src={item.value} alt="Eliminated" className={styles.itemImage} style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px', marginLeft: '0.5rem' }} />
            ) : (
              <span className={styles.text}>{item.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
