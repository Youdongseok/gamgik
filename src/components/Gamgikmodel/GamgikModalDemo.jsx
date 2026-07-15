import { useEffect, useRef, useState } from 'react';
import GamgikAgentOrbWithFace from './GamgikAgentOrbWithFace.jsx';

export default function GamgikModalDemo() {
  const expressionStartTimerRef = useRef(null);
  const expressionTimerRef = useRef(null);
  const [expressionOverride, setExpressionOverride] = useState(null);

  useEffect(() => {
    return () => {
      if (expressionStartTimerRef.current) window.clearTimeout(expressionStartTimerRef.current);
      if (expressionTimerRef.current) window.clearTimeout(expressionTimerRef.current);
    };
  }, []);

  function showExpression(expression, duration = 900) {
    if (expressionStartTimerRef.current) window.clearTimeout(expressionStartTimerRef.current);
    if (expressionTimerRef.current) window.clearTimeout(expressionTimerRef.current);

    setExpressionOverride(expression);

    expressionStartTimerRef.current = window.setTimeout(() => {
      setExpressionOverride('blink');

      expressionTimerRef.current = window.setTimeout(() => {
        setExpressionOverride(null);
      }, 120);
    }, duration);
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

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => showExpression('happy')}
          className="rounded-md border border-cyan-200/30 bg-cyan-200/12 px-5 py-2.5 text-sm font-semibold text-cyan-50 shadow-[0_0_24px_rgba(103,232,249,0.14)] transition hover:border-cyan-100/55 hover:bg-cyan-200/20 focus:outline-none focus:ring-2 focus:ring-cyan-200/55"
        >
          ^^ 웃는 표정
        </button>

        <button
          type="button"
          onClick={() => showExpression('angry')}
          className="rounded-md border border-rose-200/30 bg-rose-300/12 px-5 py-2.5 text-sm font-semibold text-rose-50 shadow-[0_0_24px_rgba(251,113,133,0.14)] transition hover:border-rose-100/55 hover:bg-rose-300/20 focus:outline-none focus:ring-2 focus:ring-rose-200/55"
        >
          \ / 화난 표정
        </button>

        <button
          type="button"
          onClick={() => showExpression('crying')}
          className="rounded-md border border-sky-200/30 bg-sky-300/12 px-5 py-2.5 text-sm font-semibold text-sky-50 shadow-[0_0_24px_rgba(125,211,252,0.14)] transition hover:border-sky-100/55 hover:bg-sky-300/20 focus:outline-none focus:ring-2 focus:ring-sky-200/55"
        >
          ㅠ ㅠ 우는 표정
        </button>
      </div>
    </section>
  );
}
