class SoundManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
  }

  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.3; // Lower volume
      this.masterGain.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  playTick() {
    if (!this.context) this.init();
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    // Wood block / click sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.05);
    
    gain.gain.setValueAtTime(1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.05);
  }

  playWin() {
    if (!this.context) this.init();

    const now = this.context.currentTime;
    
    // Simple major arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = now + (i * 0.1);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1);
      
      osc.start(startTime);
      osc.stop(startTime + 1);
    });
  }
  playElimination() {
    if (!this.context) this.init();
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    // Softer descending tone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.4);
    
    osc.start();
    osc.stop(this.context.currentTime + 0.4);
  }
}

export const soundManager = new SoundManager();
