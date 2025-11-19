import { useState, useRef } from 'react';
import styles from './EntryList.module.css';

export default function EntryList({ items, onAdd, onRemove, onClear, onRemoveDuplicates, disabled }) {
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onAdd({ type: 'text', value: inputValue.trim() });
      setInputValue('');
    }
  };

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd({ type: 'text', value: inputValue.trim() });
      setInputValue('');
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const newItems = text.split(/\n/).map(s => s.trim()).filter(s => s);
    newItems.forEach(item => onAdd({ type: 'text', value: item }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAdd({ type: 'image', value: reader.result });
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    e.target.value = null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputGroup}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Type a name..."
          disabled={disabled}
          className={styles.input}
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImageUpload}
          disabled={disabled}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className={styles.iconButton}
          title="Add Image"
          style={{ 
            background: 'var(--surface-glass)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            width: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          📷
        </button>
        <button onClick={handleAdd} disabled={disabled || !inputValue.trim()} className={styles.addButton}>
          Add
        </button>
      </div>
      
      <div className={styles.listHeader}>
        <span>{items.length} Items</span>
        <div className={styles.headerActions}>
          <button 
            onClick={onRemoveDuplicates}
            className={styles.actionButton}
            title="Remove Duplicates"
            disabled={disabled || items.length === 0}
            style={{ marginRight: '0.5rem' }}
          >
            Unique
          </button>
          {items.length > 0 && (
            <button onClick={onClear} disabled={disabled} className={styles.clearButton}>
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className={styles.list}>
        {items.map((item, index) => (
          <div key={`${item.id || index}`} className={styles.item}>
            {item.type === 'image' ? (
              <img src={item.value} alt="Entry" className={styles.itemImage} style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px', marginRight: '0.5rem' }} />
            ) : (
              <span className={styles.itemText}>{item.value}</span>
            )}
            <button 
              onClick={() => onRemove(index)} 
              disabled={disabled}
              className={styles.removeButton}
              aria-label="Remove item"
            >
              ×
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className={styles.emptyState}>
            Add items to the wheel to get started!
          </div>
        )}
      </div>
    </div>
  );
}
