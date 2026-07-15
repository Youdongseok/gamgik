import { useEffect, useRef, useState } from 'react';
import GamgikAgentOrbWithFace from './GamgikAgentOrbWithFace.jsx';

export default function GamgikModalDemo() {
  const expressionTimerRef = useRef(null);
  const [expressionOverride, setExpressionOverride] = useState(null);

  useEffect(() => {
    return () => {
      if (expressionTimerRef.current) window.clearTimeout(expressionTimerRef.current);
    };
  }, []);

  function showHappyFace() {
    if (expressionTimerRef.current) window.clearTimeout(expressionTimerRef.current);

    setExpressionOverride('happy');

    expressionTimerRef.current = window.setTimeout(() => {
      setExpressionOverride(null);
    }, 900);
  }

  return (
    <section className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center gap-8 overflow-hidden">
      <div className="relative h-[460px] w-[460px] shrink-0 overflow-visible">
        <GamgikAgentOrbWithFace
          size={460}
          speed={10}
          motion={0.78}
          statusKey="normal"
          expressionOverride={expressionOverride}
        />
      </div>

      <button
        type="button"
        onClick={showHappyFace}
        className="rounded-md border border-cyan-200/30 bg-cyan-200/12 px-5 py-2.5 text-sm font-semibold text-cyan-50 shadow-[0_0_24px_rgba(103,232,249,0.14)] transition hover:border-cyan-100/55 hover:bg-cyan-200/20 focus:outline-none focus:ring-2 focus:ring-cyan-200/55"
      >
        ^^ 웃는 표정
      </button>
    </section>
  );
}
