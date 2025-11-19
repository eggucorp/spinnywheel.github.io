import { useEffect, useRef, useState } from 'react';
import { soundManager } from '../utils/SoundManager';
import styles from './Wheel.module.css';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e',
];

export default function Wheel({ items, isSpinning, selectedIndex, onSpinComplete, onSpinStart }) {
  const [rotation, setRotation] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const animationRef = useRef(null);
  const currentRotationRef = useRef(0);
  const lastSegmentRef = useRef(0);

  useEffect(() => {
    if (isSpinning && selectedIndex !== null) {
      const segmentAngle = 360 / items.length;
      const extraSpins = 360 * 5; // 5 full spins
      
      // We need to ensure we spin forward (positive delta)
      let targetRotation = 270 - (selectedIndex + 0.5) * segmentAngle;
      
      // Adjust target to be ahead of current rotation + extra spins
      const currentMod = currentRotationRef.current % 360;
      const diff = targetRotation - currentMod;
      // Ensure we add enough full rotations
      let totalRotation = currentRotationRef.current + diff + extraSpins;
      
      // If diff is negative (moving backward), add 360 to make it forward
      if (diff < 0) totalRotation += 360;

      const startTime = performance.now();
      const duration = 5000; // Increased to 5 seconds for more suspense
      const startRotation = currentRotationRef.current;
      const changeInRotation = totalRotation - startRotation;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        
        if (elapsed < duration) {
          // Quintic Ease Out for more suspense (slower end)
          const t = elapsed / duration;
          const ease = 1 - Math.pow(1 - t, 5);
          
          const newRotation = startRotation + changeInRotation * ease;
          setRotation(newRotation);
          currentRotationRef.current = newRotation;

          // Audio Logic
          let angleUnderPointer = (270 - newRotation) % 360;
          if (angleUnderPointer < 0) angleUnderPointer += 360;
          
          const currentSegmentIndex = Math.floor(angleUnderPointer / segmentAngle);
          
          if (currentSegmentIndex !== lastSegmentRef.current) {
            soundManager.playTick();
            lastSegmentRef.current = currentSegmentIndex;
          }

          animationRef.current = requestAnimationFrame(animate);
        } else {
          setRotation(totalRotation);
          currentRotationRef.current = totalRotation;
          onSpinComplete();
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Passive Spinning
      const passiveSpin = () => {
        // Slow rotation: 0.025 degrees per frame
        const newRotation = currentRotationRef.current + 0.025;
        setRotation(newRotation);
        currentRotationRef.current = newRotation;
        animationRef.current = requestAnimationFrame(passiveSpin);
      };
      
      animationRef.current = requestAnimationFrame(passiveSpin);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isSpinning, selectedIndex, items.length, onSpinComplete]);

  // No longer resetting rotation on item change to avoid jumps, 
  // passive spin handles it.
  useEffect(() => {
    // Just ensure we don't have stale refs if items change drastically
    // giving a small nudge if needed? No, passive spin covers it.
  }, [items.length]);

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div 
      className={styles.wheelContainer}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={!isSpinning ? onSpinStart : undefined}
    >
      <div className={styles.pointer} />
      <div 
        className={`${styles.wheel} ${!isSpinning ? styles.clickable : ''}`}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <svg viewBox="-1 -1 2 2" className={styles.svg}>
          {items.map((item, index) => {
            const startAngle = index / items.length;
            const endAngle = (index + 1) / items.length;
            const [x1, y1] = getCoordinatesForPercent(startAngle);
            const [x2, y2] = getCoordinatesForPercent(endAngle);
            const largeArcFlag = endAngle - startAngle > 0.5 ? 1 : 0;
            
            const pathData = [
              `M 0 0`,
              `L ${x1} ${y1}`,
              `A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `Z`
            ].join(' ');

            // Text Rotation Logic
            // Mid angle in radians
            const midAngle = (startAngle + endAngle) * Math.PI;
            // Convert to degrees for SVG transform
            let midDeg = midAngle * 180 / Math.PI;
            
            // Calculate angle for this slice (used for both text and image logic)
            const angleRad = (endAngle - startAngle) * 2 * Math.PI;
            
            // Special case: if there's only 1 item, center the text
            const isSingleItem = items.length === 1;
            
            // Adjust for readability
            // If the text is on the left side (90 to 270 degrees), flip it 180
            
            let transform = isSingleItem ? 'rotate(0)' : `rotate(${midDeg})`;
            let xPos = isSingleItem ? 0 : 0.6;
            
            if (!isSingleItem && midDeg > 90 && midDeg < 270) {
               midDeg += 180;
               transform = `rotate(${midDeg})`;
               xPos = -0.6; // Move to opposite side so it lands in the correct slice
            }
            
            // Dynamic fontSize calculation per slice
            // Calculate available arc length at text radius
            const textRadius = 0.6;
            const arcLength = textRadius * angleRad;
            
            // For text items, calculate optimal font size to fill the slice
            let dynamicFontSize = 0.1; // default
            if (item.type === 'text') {
              const textLength = item.value.length;
              // Estimate: each character needs about fontSize of arc length
              // Be VERY conservative - use only 50% of calculated space
              dynamicFontSize = (arcLength / textLength);
              // Clamp between much tighter bounds
              dynamicFontSize = Math.max(0.05, Math.min(0.1, dynamicFontSize));
            }
            
            // Image Logic - clipPath for image masking
            const halfAngle = angleRad / 2;
            const r = 1; // radius
            
            // Calculate local coordinates for the wedge
            // Standard orientation (pointing East)
            const wx1 = Math.cos(-halfAngle);
            const wy1 = Math.sin(-halfAngle);
            const wx2 = Math.cos(halfAngle);
            const wy2 = Math.sin(halfAngle);
            const largeArc = angleRad > Math.PI ? 1 : 0;
            
            const localPathData = [
              `M 0 0`,
              `L ${wx1} ${wy1}`,
              `A 1 1 0 ${largeArc} 1 ${wx2} ${wy2}`,
              `Z`
            ].join(' ');

            return (
              <g key={item.id || index}>
                <path 
                  d={pathData} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="none"
                />
                {item.type === 'image' ? (
                  <g transform={transform}>
                     <defs>
                        <clipPath id={`clip-${item.id || index}`}>
                          <path d={localPathData} transform={midDeg > 90 && midDeg < 270 ? "rotate(180)" : ""} />
                        </clipPath>
                     </defs>
                     <image
                        href={item.value}
                        x={midDeg > 90 && midDeg < 270 ? -0.9 : 0.05}
                        y={-0.9}
                        width="0.9"
                        height="1.8"
                        preserveAspectRatio="xMidYMid meet"
                        clipPath={`url(#clip-${item.id || index})`}
                        style={{ pointerEvents: 'none' }}
                     />
                  </g>
                ) : (
                  <text
                    x={xPos}
                    y="0"
                    fill="white"
                    fontSize={dynamicFontSize}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={transform} 
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {item.value}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {!isSpinning && items.length >= 2 && (
        <div className={styles.clickToSpinOverlay}>
          <span>CLICK TO SPIN</span>
        </div>
      )}
    </div>
  );
}
