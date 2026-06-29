'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GarimReferenceOrb } from './GamgikBlobOrb.jsx';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function AgentFace({ look, expression }) {
  const faceY = look.y > 0 ? look.y * 5.2 : look.y * 2.8;
  const eyeY = look.y > 0 ? look.y * 8 : look.y * 4.4;

  return (
    <div
      className={`garim-agent-face is-${expression}`}
      style={{
        '--face-x': `${look.x * 3.2}px`,
        '--face-y': `${faceY}px`,
        '--eye-x': `${look.x * 5.2}px`,
        '--eye-y': `${eyeY}px`,
      }}
    >
      <div className="garim-face-glow" />

      <div className="garim-eye-layer">
        <span className="garim-eye garim-eye-left" aria-hidden="true">
          <i className="garim-eye-pillar" />
          <i className="garim-chevron-line garim-chevron-top" />
          <i className="garim-chevron-line garim-chevron-bottom" />
        </span>

        <span className="garim-eye garim-eye-right" aria-hidden="true">
          <i className="garim-eye-pillar" />
          <i className="garim-chevron-line garim-chevron-top" />
          <i className="garim-chevron-line garim-chevron-bottom" />
        </span>
      </div>
    </div>
  );
}

export default function GarimAgentOrbWithFace({
  size = 460,
  speed = 0.95,
  motion = 0.78,
  statusKey = 'normal',
  className = '',
}) {
  const wrapRef = useRef(null);
  const blinkTimerRef = useRef(null);
  const resetTimerRef = useRef(null);
  const expressionTimerRef = useRef(null);
  const expressionRef = useRef('idle');

  const [look, setLook] = useState({ x: 0, y: 0 });
  const [expression, setExpression] = useState('idle');

  useEffect(() => {
    expressionRef.current = expression;
  }, [expression]);

  useEffect(() => {
    function scheduleBlink() {
      const delay = 1800 + Math.random() * 2400;

      blinkTimerRef.current = window.setTimeout(() => {
        if (expressionRef.current !== 'idle') {
          scheduleBlink();
          return;
        }

        setExpression('blink');

        resetTimerRef.current = window.setTimeout(() => {
          setExpression('idle');
          scheduleBlink();
        }, 140);
      }, delay);
    }

    scheduleBlink();

    return () => {
      if (blinkTimerRef.current) window.clearTimeout(blinkTimerRef.current);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      if (expressionTimerRef.current) window.clearTimeout(expressionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    function handlePointerMove(event) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const rangeX = Math.max(window.innerWidth / 2, 1);
      const rangeY = Math.max(window.innerHeight / 2, 1);

      const x = (event.clientX - centerX) / rangeX;
      const y = (event.clientY - centerY) / rangeY;

      setLook({
        x: clamp(x, -1, 1),
        y: clamp(y, -1, 1),
      });
    }

    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  function triggerExpression(nextExpression, duration = 520) {
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    if (expressionTimerRef.current) window.clearTimeout(expressionTimerRef.current);

    setExpression(nextExpression);

    expressionTimerRef.current = window.setTimeout(() => {
      setExpression('idle');
    }, duration);
  }

  function handleClick(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextExpression = event.clientX < rect.left + rect.width / 2 ? 'wink-left' : 'wink-right';

    triggerExpression(nextExpression, 520);
  }

  return (
    <div
      ref={wrapRef}
      className={`garim-agent-orb-wrap ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }}
      onClick={handleClick}
    >
      <GarimReferenceOrb size={size} speed={speed} motion={motion} statusKey={statusKey} />

      <AgentFace look={look} expression={expression} />

      <style>{`
        .garim-agent-orb-wrap {
          position: relative;
          display: grid;
          place-items: center;
          isolation: isolate;
          cursor: pointer;
          user-select: none;
        }

        .garim-agent-orb-wrap.garim-agent-orb-modal-visual {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }

        .garim-agent-orb-wrap .garim-reference-orb {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .garim-agent-face {
          position: absolute;
          left: 50%;
          top: 51%;
          width: 34%;
          height: 19%;
          z-index: 5;
          pointer-events: none;
          transform:
            translate(-50%, -50%)
            translate(var(--face-x), var(--face-y));
          transition:
            transform 180ms ease,
            opacity 180ms ease;
          opacity: 0.94;
          mix-blend-mode: screen;
        }

        .garim-face-glow {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 112%;
          height: 82%;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background:
            radial-gradient(
              ellipse at 48% 50%,
              rgba(190, 235, 255, 0.46) 0%,
              rgba(88, 190, 255, 0.28) 30%,
              rgba(120, 92, 255, 0.24) 54%,
              rgba(139, 92, 246, 0.08) 76%,
              rgba(139, 92, 246, 0) 100%
            );
          filter: blur(13px);
          opacity: 0.68;
          animation: garimFaceGlowPulse 3.8s ease-in-out infinite;
        }

        .garim-face-glow::after {
          content: "";
          position: absolute;
          inset: 8%;
          border-radius: inherit;
          background-image:
            radial-gradient(circle, rgba(210, 245, 255, 0.38) 0 0.7px, transparent 0.9px);
          background-size: 4px 4px;
          opacity: 0.24;
          mix-blend-mode: screen;
          mask-image: radial-gradient(ellipse at center, black 0%, black 54%, transparent 78%);
        }

        .garim-eye-layer {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 86%;
          height: 58%;
          transform:
            translate(-50%, -50%)
            translate(var(--eye-x), var(--eye-y));
          transition: transform 160ms ease;
        }

        .garim-eye {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: block;
          filter:
            drop-shadow(0 0 3px rgba(255, 255, 255, 0.92))
            drop-shadow(0 0 8px rgba(190, 235, 255, 0.62))
            drop-shadow(0 0 16px rgba(139, 92, 246, 0.42));
          transition:
            transform 90ms ease,
            opacity 110ms ease,
            filter 160ms ease,
            width 90ms ease,
            left 90ms ease,
            right 90ms ease;
        }

        /*
          기본 표정: I I
          눈 사이 간격 넓힘
        */
        .garim-eye-left {
          left: 25%;
          width: 10%;
          height: 64%;
        }

        .garim-eye-right {
          right: 25%;
          width: 10%;
          height: 64%;
        }

        .garim-eye-pillar {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 46%;
          height: 100%;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          opacity: 1;
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.96) 0%,
              rgba(245, 252, 255, 1) 44%,
              rgba(212, 235, 255, 0.94) 100%
            );
          box-shadow:
            inset 0 0 4px rgba(255, 255, 255, 0.9),
            0 0 7px rgba(255, 255, 255, 0.78),
            0 0 16px rgba(154, 220, 255, 0.48);
          transition:
            opacity 90ms ease,
            transform 90ms ease;
        }

        /*
          꺾인 눈 기본값: 숨김
        */
        .garim-chevron-line {
          position: absolute;
          top: 50%;
          height: 28%;
          border-radius: 999px;
          opacity: 0;
          background:
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.96) 0%,
              rgba(247, 252, 255, 1) 42%,
              rgba(218, 235, 255, 0.95) 100%
            );
          box-shadow:
            inset 0 0 4px rgba(255, 255, 255, 0.9),
            0 0 7px rgba(255, 255, 255, 0.78),
            0 0 16px rgba(154, 220, 255, 0.48);
          transition:
            opacity 90ms ease,
            transform 90ms ease;
        }

        /*
          오른쪽 눈이 < 가 되는 표정
          핵심: 두 선이 왼쪽 꼭짓점에서 만나고 오른쪽으로 벌어짐
        */
        .garim-agent-face.is-wink-right .garim-eye-right {
          width: 24%;
          right: 11%;
        }

        .garim-agent-face.is-wink-right .garim-eye-right .garim-eye-pillar {
          opacity: 0;
          transform: translate(-50%, -50%) scaleY(0.2);
        }

        .garim-agent-face.is-wink-right .garim-eye-right .garim-chevron-line {
          opacity: 1;
          left: 16%;
          width: 64%;
          transform-origin: 8% 50%;
        }

        .garim-agent-face.is-wink-right .garim-eye-right .garim-chevron-top {
          transform: translateY(-50%) rotate(-42deg);
        }

        .garim-agent-face.is-wink-right .garim-eye-right .garim-chevron-bottom {
          transform: translateY(-50%) rotate(42deg);
        }

        /*
          왼쪽 눈이 > 가 되는 표정
          핵심: 두 선이 오른쪽 꼭짓점에서 만나고 왼쪽으로 벌어짐
        */
        .garim-agent-face.is-wink-left .garim-eye-left {
          width: 24%;
          left: 11%;
        }

        .garim-agent-face.is-wink-left .garim-eye-left .garim-eye-pillar {
          opacity: 0;
          transform: translate(-50%, -50%) scaleY(0.2);
        }

        .garim-agent-face.is-wink-left .garim-eye-left .garim-chevron-line {
          opacity: 1;
          right: 16%;
          left: auto;
          width: 64%;
          transform-origin: 92% 50%;
        }

        .garim-agent-face.is-wink-left .garim-eye-left .garim-chevron-top {
          transform: translateY(-50%) rotate(42deg);
        }

        .garim-agent-face.is-wink-left .garim-eye-left .garim-chevron-bottom {
          transform: translateY(-50%) rotate(-42deg);
        }

        /*
          깜빡임: I I 둘 다 납작하게
        */
        .garim-agent-face.is-blink .garim-eye {
          transform: translateY(-50%) scaleY(0.1);
          opacity: 0.42;
        }

        .garim-agent-face.is-blink .garim-eye-pillar {
          opacity: 0.62;
        }

        .garim-agent-orb-wrap:hover .garim-agent-face {
          opacity: 1;
        }

        .garim-agent-orb-wrap:hover .garim-face-glow {
          opacity: 0.82;
        }

        .garim-agent-orb-wrap:hover .garim-eye {
          filter:
            drop-shadow(0 0 4px rgba(255, 255, 255, 1))
            drop-shadow(0 0 10px rgba(210, 245, 255, 0.76))
            drop-shadow(0 0 20px rgba(139, 92, 246, 0.54));
        }

        @keyframes garimFaceGlowPulse {
          0%, 100% {
            opacity: 0.56;
            transform: translate(-50%, -50%) scale(0.96);
          }

          50% {
            opacity: 0.76;
            transform: translate(-50%, -50%) scale(1.04);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .garim-agent-face,
          .garim-eye-layer,
          .garim-eye,
          .garim-face-glow,
          .garim-eye-pillar,
          .garim-chevron-line {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
