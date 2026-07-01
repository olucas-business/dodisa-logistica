import { useState, useEffect, useRef } from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  useLocale?: boolean;
}

export default function CountUp({
  value,
  duration = 1200,
  prefix = "",
  suffix = "",
  decimals = 0,
  useLocale = true
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = countRef.current;
    const endValue = value;

    if (startValue === endValue) {
      setCount(endValue);
      return;
    }

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutQuad (starts fast, slows down at the end)
      const easedProgress = progress * (2 - progress);
      
      const currentValue = startValue + easedProgress * (endValue - startValue);
      countRef.current = currentValue;
      setCount(currentValue);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        countRef.current = endValue;
        setCount(endValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  const formattedValue = useLocale
    ? count.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : count.toFixed(decimals);

  return (
    <span className="font-mono">
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}
