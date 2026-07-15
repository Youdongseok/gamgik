'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GarimReferenceOrb } from './GamgikBlobOrb.jsx';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function AgentFace({ look, expression }) {
  const faceY = look.y * 6.2;
  const eyeY = look.y * 10.5;

  return (
    <div
      className={`garim-agent-face is-${expression}`}
      style={{
        '--face-x': `${look.x * 4.6}px`,
        '--face-y': `${faceY}px`,
        '--eye-x': `${look.x * 8.8}px`,
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

      <div className="garim-tear-layer" aria-hidden="true">
        <i className="garim-tear garim-tear-left" />
        <i className="garim-tear garim-tear-right" />
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
  expressionOverride = null,
}) {
  const wrapRef = useRef(null);
  const blinkTimerRef = useRef(null);
  const clickTimerRef = useRef(null);
  const motionTimerRef = useRef(null);
  const resetTimerRef = useRef(null);
  const expressionStartTimerRef = useRef(null);
  const expressionTimerRef = useRef(null);
  const expressionRef = useRef('idle');

  const [look, setLook] = useState({ x: 0, y: 0 });
  const [expression, setExpression] = useState('idle');
  const [isClickMoving, setIsClickMoving] = useState(false);
  const visibleExpression = expressionOverride ?? expression;

  function triggerExpression(nextExpression, duration = 520) {
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    if (expressionStartTimerRef.current) window.clearTimeout(expressionStartTimerRef.current);
    if (expressionTimerRef.current) window.clearTimeout(expressionTimerRef.current);

    setExpression(nextExpression);

    expressionStartTimerRef.current = window.setTimeout(() => {
      setExpression('blink');

      expressionTimerRef.current = window.setTimeout(() => {
        setExpression('idle');
      }, 120);
    }, duration);
  }

  useEffect(() => {
    expressionRef.current = visibleExpression;
  }, [visibleExpression]);

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
      if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
      if (motionTimerRef.current) window.clearTimeout(motionTimerRef.current);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      if (expressionStartTimerRef.current) window.clearTimeout(expressionStartTimerRef.current);
      if (expressionTimerRef.current) window.clearTimeout(expressionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    function isPointerInsideViewport(event) {
      return (
        event.clientX >= 0 &&
        event.clientX <= window.innerWidth &&
        event.clientY >= 0 &&
        event.clientY <= window.innerHeight
      );
    }

    function resetLook() {
      setLook({ x: 0, y: 0 });
    }

    function handlePointerMove(event) {
      if (!isPointerInsideViewport(event)) {
        resetLook();
        return;
      }

      const rect = wrapRef.current?.getBoundingClientRect();
      const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const centerY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      const range = Math.max(rect ? Math.min(rect.width, rect.height) * 0.62 : 180, 1);

      const x = (event.clientX - centerX) / range;
      const y = (event.clientY - centerY) / range;

      setLook({
        x: clamp(x, -1, 1),
        y: clamp(y, -1, 1),
      });
    }

    function handlePointerOut(event) {
      if (!event.relatedTarget) {
        resetLook();
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') {
        resetLook();
      }
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', resetLook);
    window.addEventListener('blur', resetLook);
    document.addEventListener('pointerout', handlePointerOut);
    document.addEventListener('mouseleave', resetLook);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', resetLook);
      window.removeEventListener('blur', resetLook);
      document.removeEventListener('pointerout', handlePointerOut);
      document.removeEventListener('mouseleave', resetLook);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  function playClickMotion() {
    if (motionTimerRef.current) window.clearTimeout(motionTimerRef.current);

    setIsClickMoving(false);

    window.requestAnimationFrame(() => {
      setIsClickMoving(true);
      motionTimerRef.current = window.setTimeout(() => {
        setIsClickMoving(false);
      }, 520);
    });
  }

  function handleClick(event) {
    if (event.detail >= 2) {
      if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
      playClickMotion();
      triggerExpression('surprised', 720);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const nextExpression = event.clientX < rect.left + rect.width / 2 ? 'wink-left' : 'wink-right';

    clickTimerRef.current = window.setTimeout(() => {
      triggerExpression(nextExpression, 520);
    }, 180);
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
      <div className={`garim-agent-motion ${isClickMoving ? 'is-click-moving' : ''}`}>
        <GarimReferenceOrb size={size} speed={speed} motion={motion} statusKey={statusKey} />

        <AgentFace look={look} expression={visibleExpression} />

        <div className={`garim-surprise-marks is-${visibleExpression}`} aria-hidden="true">
          <i className="garim-surprise-mark garim-surprise-mark-left" />
          <i className="garim-surprise-mark garim-surprise-mark-middle" />
          <i className="garim-surprise-mark garim-surprise-mark-right" />
        </div>

        <div className={`garim-anger-mark is-${visibleExpression}`} aria-hidden="true">
          <span className="garim-anger-corner garim-anger-corner-top">
            <i className="garim-chevron-line garim-chevron-top" />
            <i className="garim-chevron-line garim-chevron-bottom" />
          </span>
          <span className="garim-anger-corner garim-anger-corner-right">
            <i className="garim-chevron-line garim-chevron-top" />
            <i className="garim-chevron-line garim-chevron-bottom" />
          </span>
          <span className="garim-anger-corner garim-anger-corner-bottom">
            <i className="garim-chevron-line garim-chevron-top" />
            <i className="garim-chevron-line garim-chevron-bottom" />
          </span>
          <span className="garim-anger-corner garim-anger-corner-left">
            <i className="garim-chevron-line garim-chevron-top" />
            <i className="garim-chevron-line garim-chevron-bottom" />
          </span>
        </div>
      </div>

      <style>{`
        .garim-agent-orb-wrap {
          position: relative;
          display: grid;
          place-items: center;
          isolation: isolate;
          cursor: pointer;
          user-select: none;
        }

        .garim-agent-motion {
          position: absolute;
          inset: 0;
          transform-origin: 50% 58%;
        }

        .garim-agent-motion.is-click-moving {
          animation: garimAgentClickMove 520ms cubic-bezier(0.2, 0.9, 0.22, 1);
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

        .garim-agent-face.is-surprised .garim-eye {
          width: 12%;
          transform: translateY(-50%) scaleY(1.12);
          filter:
            drop-shadow(0 0 5px rgba(255, 255, 255, 1))
            drop-shadow(0 0 13px rgba(210, 245, 255, 0.86))
            drop-shadow(0 0 24px rgba(139, 92, 246, 0.58));
        }

        .garim-agent-face.is-surprised .garim-eye-pillar {
          width: 50%;
          height: 108%;
          border-radius: 999px;
        }

        .garim-agent-face.is-surprised .garim-face-glow {
          opacity: 0.9;
        }

        .garim-agent-face.is-happy .garim-eye {
          width: 24%;
          height: 64%;
          transform: translateY(-50%) rotate(90deg);
          filter:
            drop-shadow(0 0 5px rgba(255, 255, 255, 1))
            drop-shadow(0 0 13px rgba(210, 245, 255, 0.82))
            drop-shadow(0 0 22px rgba(139, 92, 246, 0.52));
        }

        .garim-agent-face.is-happy .garim-eye-left {
          left: 11%;
        }

        .garim-agent-face.is-happy .garim-eye-right {
          right: 11%;
        }

        .garim-agent-face.is-happy .garim-eye-pillar {
          opacity: 0;
          transform: translate(-50%, -50%) scaleY(0.2);
        }

        .garim-agent-face.is-happy .garim-chevron-line {
          left: 16%;
          top: 50%;
          width: 64%;
          opacity: 1;
          transform-origin: 8% 50%;
        }

        .garim-agent-face.is-happy .garim-chevron-top {
          transform: translateY(-50%) rotate(-42deg);
        }

        .garim-agent-face.is-happy .garim-chevron-bottom {
          transform: translateY(-50%) rotate(42deg);
        }

        .garim-agent-face.is-happy .garim-face-glow {
          opacity: 0.86;
        }

        .garim-agent-face.is-angry .garim-eye {
          width: 12%;
          transform: translateY(-50%) scaleY(1.12);
          filter:
            drop-shadow(0 0 5px rgba(255, 255, 255, 1))
            drop-shadow(0 0 13px rgba(210, 245, 255, 0.86))
            drop-shadow(0 0 24px rgba(139, 92, 246, 0.58));
        }

        .garim-agent-face.is-angry .garim-eye-left {
          left: 20%;
        }

        .garim-agent-face.is-angry .garim-eye-right {
          right: 20%;
        }

        .garim-agent-face.is-angry .garim-eye-pillar {
          opacity: 1;
          width: 50%;
          height: 108%;
          border-radius: 999px;
          transform: translate(-50%, -50%);
        }

        .garim-agent-face.is-angry .garim-eye-left .garim-eye-pillar {
          transform: translate(-50%, -50%) rotate(-24deg);
        }

        .garim-agent-face.is-angry .garim-eye-right .garim-eye-pillar {
          transform: translate(-50%, -50%) rotate(24deg);
        }

        .garim-agent-face.is-angry .garim-chevron-top,
        .garim-agent-face.is-angry .garim-chevron-bottom {
          opacity: 0;
        }

        .garim-agent-face.is-angry .garim-face-glow {
          opacity: 0.82;
        }

        .garim-tear-layer {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 86%;
          height: 58%;
          transform:
            translate(-50%, -50%)
            translate(var(--eye-x), var(--eye-y))
            scale(0.86);
          pointer-events: none;
          opacity: 0;
          transition:
            opacity 110ms ease,
            transform 160ms ease;
        }

        .garim-tear {
          position: absolute;
          top: 110%;
          width: 7%;
          aspect-ratio: 0.78;
          border-radius: 999px 999px 999px 0;
          background:
            radial-gradient(circle at 36% 30%, rgba(255, 255, 255, 0.98) 0 12%, transparent 13%),
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.96) 0%,
              rgba(226, 248, 255, 0.98) 42%,
              rgba(134, 210, 255, 0.9) 100%
            );
          box-shadow:
            inset 0 0 4px rgba(255, 255, 255, 0.82),
            0 0 6px rgba(255, 255, 255, 0.72),
            0 0 14px rgba(154, 220, 255, 0.5);
          transition: transform 120ms ease;
        }

        .garim-tear-left {
          left: 25%;
          transform: translate(-50%, -50%) scaleX(-1) rotate(135deg);
        }

        .garim-tear-right {
          left: 75%;
          transform: translate(-50%, -50%) rotate(135deg);
        }

        .garim-agent-face.is-crying .garim-eye {
          width: 12%;
          transform: translateY(-50%) scaleY(1.12);
          filter:
            drop-shadow(0 0 5px rgba(255, 255, 255, 1))
            drop-shadow(0 0 13px rgba(210, 245, 255, 0.86))
            drop-shadow(0 0 24px rgba(139, 92, 246, 0.58));
        }

        .garim-agent-face.is-crying .garim-eye-pillar {
          width: 50%;
          height: 108%;
          border-radius: 999px;
        }

        .garim-agent-face.is-crying .garim-tear-layer {
          opacity: 1;
          transform:
            translate(-50%, -50%)
            translate(var(--eye-x), var(--eye-y))
            scale(1);
        }

        .garim-agent-face.is-crying .garim-face-glow {
          opacity: 0.88;
        }

        .garim-surprise-marks {
          position: absolute;
          left: 18%;
          top: 13%;
          width: 26%;
          height: 24%;
          z-index: 6;
          pointer-events: none;
          opacity: 0;
          transform: scale(0.84) translateY(8px);
          transform-origin: 70% 80%;
          transition:
            opacity 120ms ease,
            transform 180ms cubic-bezier(0.2, 1.2, 0.24, 1);
        }

        .garim-surprise-marks.is-surprised {
          opacity: 1;
          transform: scale(1) translateY(0);
        }

        .garim-surprise-mark {
          position: absolute;
          display: block;
          width: 9%;
          height: 39%;
          border-radius: 999px;
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 1) 0%,
              rgba(250, 253, 255, 1) 48%,
              rgba(222, 232, 255, 0.96) 100%
            );
          box-shadow:
            0 0 5px rgba(255, 255, 255, 0.95),
            0 0 14px rgba(184, 184, 255, 0.78),
            0 0 27px rgba(112, 92, 255, 0.62);
        }

        .garim-surprise-mark-left {
          left: 4%;
          top: 55%;
          height: 35%;
          transform: rotate(-62deg);
        }

        .garim-surprise-mark-middle {
          left: 31%;
          top: 25%;
          height: 42%;
          transform: rotate(-36deg);
        }

        .garim-surprise-mark-right {
          left: 62%;
          top: 4%;
          height: 45%;
          transform: rotate(-10deg);
        }

        .garim-anger-mark {
          position: absolute;
          left: 61%;
          top: 17%;
          width: 19%;
          height: 19%;
          z-index: 6;
          pointer-events: none;
          opacity: 0;
          transform: scale(0.82) rotate(-8deg);
          transform-origin: 50% 50%;
          transition:
            opacity 120ms ease,
            transform 180ms cubic-bezier(0.2, 1.2, 0.24, 1);
        }

        .garim-anger-mark.is-angry {
          opacity: 1;
          transform: scale(1) rotate(-8deg);
        }

        .garim-anger-corner {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 47%;
          height: 47%;
          transform-origin: 0% 50%;
          filter:
            drop-shadow(0 0 4px rgba(255, 255, 255, 0.96))
            drop-shadow(0 0 10px rgba(210, 245, 255, 0.72))
            drop-shadow(0 0 18px rgba(139, 92, 246, 0.48));
        }

        .garim-anger-corner .garim-chevron-line {
          left: 13%;
          top: 50%;
          width: 68%;
          height: 24%;
          opacity: 1;
          transform-origin: 8% 50%;
        }

        .garim-anger-corner .garim-chevron-top {
          transform: translateY(-50%) rotate(-42deg);
        }

        .garim-anger-corner .garim-chevron-bottom {
          transform: translateY(-50%) rotate(42deg);
        }

        .garim-anger-corner-top {
          transform: rotate(-90deg) translateX(4%);
        }

        .garim-anger-corner-right {
          transform: rotate(0deg) translateX(4%);
        }

        .garim-anger-corner-bottom {
          transform: rotate(90deg) translateX(4%);
        }

        .garim-anger-corner-left {
          transform: rotate(180deg) translateX(4%);
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

        @keyframes garimAgentClickMove {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          18% {
            transform: translate3d(0, 8px, 0) scale(0.97, 0.94);
          }

          42% {
            transform: translate3d(0, -10px, 0) scale(1.035, 1.045);
          }

          68% {
            transform: translate3d(0, 4px, 0) scale(0.99, 0.985);
          }

          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .garim-agent-face,
          .garim-agent-motion,
          .garim-eye-layer,
          .garim-eye,
          .garim-face-glow,
          .garim-eye-pillar,
          .garim-chevron-line,
          .garim-tear-layer,
          .garim-tear,
          .garim-anger-mark {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
