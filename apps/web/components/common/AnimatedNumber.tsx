import React, { useEffect, useState } from 'react';

// Custom hook for counting number
const useCountUp = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease Out Expo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(end * ease));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return count;
};

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    format?: (n: number) => string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 1500, format }) => {
  const count = useCountUp(value, duration);
  return <>{format ? format(count) : count.toLocaleString()}</>;
};

export default AnimatedNumber;
