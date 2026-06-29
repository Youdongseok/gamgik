import { useEffect, useRef } from 'react';

import { STATUS_COLORS } from './statusColors.js';

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = 0.5 * (a_position + 1.0);
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  varying vec2 v_uv;
  uniform float u_time;
  uniform float u_ratio;
  uniform vec2 u_pointer_position;
  uniform float u_scroll_progress;
  uniform float u_minimum_glow;
  uniform float u_speed;
  uniform float u_intensity;
  uniform float u_alpha_floor;
  uniform vec3 u_deep_color;
  uniform vec3 u_mid_color;
  uniform vec3 u_accent_color;
  uniform vec3 u_surface_color;
  uniform float u_white_highlight;

  vec2 rotate(vec2 uv, float th) {
    return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
  }

  float neuro_shape(vec2 uv, float t, float p) {
    vec2 sine_acc = vec2(0.0);
    vec2 res = vec2(0.0);
    float scale = 8.0;

    for (int j = 0; j < 15; j++) {
      uv = rotate(uv, 1.0);
      sine_acc = rotate(sine_acc, 1.0);

      vec2 layer = uv * scale + float(j) + sine_acc - t;

      sine_acc += sin(layer) + 2.15 * p;
      res += (0.5 + 0.5 * cos(layer)) / scale;

      scale *= 1.2;
    }

    return res.x + res.y;
  }

  void main() {
    vec2 centered = v_uv - 0.5;
    centered.x *= u_ratio;

    // 기존 0.92보다 낮춰서 패턴 자체를 조금 더 크게 보이게 함
    vec2 uv = centered * 0.78;

    vec2 pointer = v_uv - u_pointer_position;
    pointer.x *= u_ratio;

    float p = clamp(length(pointer), 0.0, 1.0);
    p = 0.5 * pow(1.0 - p, 2.0);

    float t = u_speed * u_time;
    float noise = neuro_shape(uv, t, p);

    noise = 1.12 * pow(noise, 2.9);
    noise += pow(noise, 7.4);
    noise = max(0.0, noise - 0.39);

    float distanceFromCenter = length(v_uv - 0.5);

    // 기존 0.28, 0.58보다 범위를 넓혀서 중앙 효과 영역을 조금 키움
    float coreMask = 1.0 - smoothstep(0.34, 0.68, distanceFromCenter);
    float innerSoftness = smoothstep(0.03, 0.24, distanceFromCenter);
    float centerOnlyMask = coreMask * (0.72 + innerSoftness * 0.28);

    // 정중앙에 너무 모여 보이는 밝은 패턴만 약화
    // 전체 패턴은 유지하고, 중심부만 살짝 눌러줌
    float centerKnotFade = mix(0.52, 1.0, smoothstep(0.018, 0.13, distanceFromCenter));

    float surfaceLight = smoothstep(0.15, 1.0, v_uv.y);

    float pointerGlow = p * 0.16;

    float glow = noise * (0.95 + pointerGlow) * centerOnlyMask * centerKnotFade;
    glow = max(glow, u_minimum_glow * centerOnlyMask * centerKnotFade);

    float pulse = 0.88 + 0.12 * sin(u_time * 0.00032 + u_scroll_progress * 6.28318);

    vec3 color = mix(u_deep_color, u_mid_color, surfaceLight * 0.52);
    color = mix(color, u_accent_color, clamp(glow * 1.65 + pointerGlow * centerOnlyMask, 0.0, 1.0));
    color += u_surface_color * pow(surfaceLight, 3.0) * 0.018 * centerOnlyMask;
    color += vec3(1.0) * pow(surfaceLight, 4.0) * 0.014 * centerOnlyMask;

    vec3 finalColor = color * glow * pulse * u_intensity;
    finalColor += u_accent_color * pow(glow, 2.0) * 0.28 * u_intensity;
    finalColor += vec3(1.0) * pow(glow, 2.45) * u_white_highlight * u_intensity;

    float alpha = clamp(max(glow, u_alpha_floor * centerOnlyMask * centerKnotFade), 0.0, 0.88);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function normalizeHexColor(value, fallback = STATUS_COLORS.normal) {
  const color = String(value || '').trim();

  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return color;
  }

  return fallback;
}

function hexToRgb(value) {
  const color = normalizeHexColor(value).slice(1);
  const number = Number.parseInt(color, 16);

  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

function hexToGlColor(value) {
  const { r, g, b } = hexToRgb(value);

  return [r / 255, g / 255, b / 255];
}

function getColorLuminance(value) {
  const { r, g, b } = hexToRgb(value);

  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function hexToRgba(value, alpha) {
  const { r, g, b } = hexToRgb(value);

  return `rgba(${r},${g},${b},${alpha})`;
}

function mixHexColor(color, target, amount) {
  const sourceRgb = hexToRgb(color);
  const targetRgb = hexToRgb(target);
  const mixChannel = channel =>
    Math.round(sourceRgb[channel] + (targetRgb[channel] - sourceRgb[channel]) * amount);

  return `#${[mixChannel('r'), mixChannel('g'), mixChannel('b')]
    .map(channel => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

function getAlertOrbPalette(statusKey = 'normal') {
  const accentColor = normalizeHexColor(STATUS_COLORS[statusKey], STATUS_COLORS.normal);
  const luminance = getColorLuminance(accentColor);

  return {
    accentColor,
    deepColor: mixHexColor(accentColor, '#020207', 0.88),
    midColor: mixHexColor(accentColor, '#05040d', 0.72),
    surfaceColor: mixHexColor(accentColor, '#ffffff', 0.66),
    whiteHighlight: 0.045 + luminance * 0.055,
  };
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || 'Failed to compile shader.');
  }

  return shader;
}

function createProgram(gl) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message || 'Failed to link shader program.');
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

function ShaderBackground({
  className = '',
  minimumGlow = 0,
  speed = 0.00072,
  intensity = 1,
  alphaFloor = 0,
  palette,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const { accentColor, deepColor, midColor, surfaceColor, whiteHighlight } = palette;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) {
      return undefined;
    }

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true });

    if (!gl) {
      return undefined;
    }

    const program = createProgram(gl);
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const ratioLocation = gl.getUniformLocation(program, 'u_ratio');
    const pointerLocation = gl.getUniformLocation(program, 'u_pointer_position');
    const scrollLocation = gl.getUniformLocation(program, 'u_scroll_progress');
    const minimumGlowLocation = gl.getUniformLocation(program, 'u_minimum_glow');
    const speedLocation = gl.getUniformLocation(program, 'u_speed');
    const intensityLocation = gl.getUniformLocation(program, 'u_intensity');
    const alphaFloorLocation = gl.getUniformLocation(program, 'u_alpha_floor');
    const deepColorLocation = gl.getUniformLocation(program, 'u_deep_color');
    const midColorLocation = gl.getUniformLocation(program, 'u_mid_color');
    const accentColorLocation = gl.getUniformLocation(program, 'u_accent_color');
    const surfaceColorLocation = gl.getUniformLocation(program, 'u_surface_color');
    const whiteHighlightLocation = gl.getUniformLocation(program, 'u_white_highlight');
    const vertexBuffer = gl.createBuffer();

    if (
      positionLocation < 0 ||
      !timeLocation ||
      !ratioLocation ||
      !pointerLocation ||
      !scrollLocation ||
      !minimumGlowLocation ||
      !speedLocation ||
      !intensityLocation ||
      !alphaFloorLocation ||
      !deepColorLocation ||
      !midColorLocation ||
      !accentColorLocation ||
      !surfaceColorLocation ||
      !whiteHighlightLocation ||
      !vertexBuffer
    ) {
      gl.deleteProgram(program);
      return undefined;
    }

    const pointer = {
      x: 0.5,
      y: 0.5,
      targetX: 0.5,
      targetY: 0.5,
    };

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.uniform3fv(deepColorLocation, hexToGlColor(deepColor));
    gl.uniform3fv(midColorLocation, hexToGlColor(midColor));
    gl.uniform3fv(accentColorLocation, hexToGlColor(accentColor));
    gl.uniform3fv(surfaceColorLocation, hexToGlColor(surfaceColor));
    gl.uniform1f(whiteHighlightLocation, whiteHighlight);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);

      canvas.width = Math.max(1, Math.floor(width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(height * pixelRatio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(ratioLocation, canvas.width / canvas.height);
    };

    const updatePointer = (x, y) => {
      const rect = container.getBoundingClientRect();

      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        return;
      }

      const localX = (x - rect.left) / Math.max(rect.width, 1);
      const localY = 1 - (y - rect.top) / Math.max(rect.height, 1);

      pointer.targetX = Math.max(0, Math.min(1, localX));
      pointer.targetY = Math.max(0, Math.min(1, localY));
    };

    const handlePointerMove = event => {
      updatePointer(event.clientX, event.clientY);
    };

    const handleTouchMove = event => {
      const touch = event.targetTouches[0];

      if (touch) {
        updatePointer(touch.clientX, touch.clientY);
      }
    };

    const render = now => {
      pointer.x += (pointer.targetX - pointer.x) * 0.08;
      pointer.y += (pointer.targetY - pointer.y) * 0.08;

      gl.uniform1f(timeLocation, now);
      gl.uniform2f(pointerLocation, pointer.x, pointer.y);
      gl.uniform1f(scrollLocation, 0.18 + 0.12 * Math.sin(now * 0.0002));
      gl.uniform1f(minimumGlowLocation, minimumGlow);
      gl.uniform1f(speedLocation, speed);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform1f(alphaFloorLocation, alphaFloor);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!prefersReducedMotion) {
        rafId = window.requestAnimationFrame(render);
      }
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;

    resize();

    resizeObserver?.observe(container);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    if (prefersReducedMotion) {
      render(0);
    } else {
      rafId = window.requestAnimationFrame(render);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      gl.deleteBuffer(vertexBuffer);
      gl.deleteProgram(program);
    };
  }, [
    accentColor,
    alphaFloor,
    deepColor,
    intensity,
    midColor,
    minimumGlow,
    speed,
    surfaceColor,
    whiteHighlight,
  ]);

  return (
    <div
      ref={containerRef}
      className={cx('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{
        background: `radial-gradient(circle at 50% -14%, ${hexToRgba(surfaceColor, 0.15)}, transparent 50%), radial-gradient(circle at 18% 18%, ${hexToRgba(accentColor, 0.11)}, transparent 38%), radial-gradient(circle at 82% 82%, ${hexToRgba(midColor, 0.2)}, transparent 46%), linear-gradient(180deg, ${deepColor} 0%, #080712 50%, #020207 100%)`,
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-[0.98] mix-blend-screen"
      />

      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background: `radial-gradient(circle at 50% 28%, ${hexToRgba(surfaceColor, 0.08)}, transparent 46%), radial-gradient(circle at 16% 12%, ${hexToRgba(accentColor, 0.09)}, transparent 36%), radial-gradient(circle at 86% 78%, ${hexToRgba(accentColor, 0.11)}, transparent 48%), linear-gradient(180deg, rgba(4,4,12,0.1) 0%, rgba(5,5,14,0.3) 48%, rgba(1,1,5,0.64) 100%)`,
        }}
      />

      <div className="absolute inset-[-100%] rotate-[10deg] opacity-[0.06] [background-image:radial-gradient(rgba(255,255,255,0.7)_0.7px,transparent_0.7px)] [background-size:8px_8px]" />
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function GarimAlertOrb({ className = '', statusKey = 'normal' }) {
  const palette = getAlertOrbPalette(statusKey);
  const { accentColor, midColor, surfaceColor } = palette;

  return (
    <div
      className={cx(
        'relative flex h-[230px] w-[230px] shrink-0 items-center justify-center',
        className
      )}
    >
      <div
        className="absolute inset-[-36px] rounded-full blur-3xl"
        style={{ backgroundColor: hexToRgba(accentColor, 0.2) }}
      />
      <div
        className="absolute inset-[-16px] rounded-full border blur-[1px]"
        style={{
          backgroundColor: hexToRgba(accentColor, 0.06),
          borderColor: hexToRgba(surfaceColor, 0.14),
        }}
      />

      <div
        className="relative h-full w-full overflow-hidden rounded-full border border-white/16 bg-[#05040d]"
        style={{
          boxShadow: `0 0 30px ${hexToRgba(surfaceColor, 0.34)}, 0 0 78px ${hexToRgba(accentColor, 0.22)}`,
        }}
      >
        <ShaderBackground
          className="contrast-[1.9] saturate-[1.75] brightness-[1.35]"
          minimumGlow={0.04}
          speed={0.0005}
          intensity={2.05}
          alphaFloor={0.02}
          palette={palette}
        />

        <ShaderBackground
          className="rotate-180 mix-blend-screen contrast-[1.7] saturate-[1.65] brightness-[1.18]"
          minimumGlow={0.02}
          speed={0.0005}
          intensity={1.45}
          alphaFloor={0.01}
          palette={palette}
        />

        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 32% 24%, rgba(255,255,255,0.19), transparent 15%), radial-gradient(circle at 58% 38%, rgba(255,255,255,0.065), transparent 16%), radial-gradient(circle at 62% 68%, ${hexToRgba(surfaceColor, 0.1)}, transparent 28%), radial-gradient(circle at 50% 50%, ${hexToRgba(midColor, 0)} 42%, rgba(2,2,7,0.2) 100%)`,
          }}
        />

        <div
          aria-hidden="true"
          className="absolute inset-[10px] rounded-full border border-white/10"
        />

        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[72%] w-[132%] -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] rounded-full border"
          style={{ borderColor: hexToRgba(surfaceColor, 0.2) }}
        />
      </div>
    </div>
  );
}

export default function GarimAlertModal({
  className = '',
  statusKey = 'normal',
  headline = '새로운 보안 알림이 도착했습니다.',
  detail = '위험 요청 및 정책 탐지 내역을 확인해 주세요',
  ctaHref,
  ctaTo = '/monitoring',
  ctaLabel = '모니터링으로 이동',
  closeLabel = '알림 닫기',
  onClose,
  onCtaClick,
  renderCta,
  renderOrb,
}) {
  const resolvedCtaHref = ctaHref || ctaTo;
  const palette = getAlertOrbPalette(statusKey);

  const ctaClassName =
    'mt-7 inline-flex h-12 min-w-[190px] items-center justify-center rounded-xl border border-[#4338CA] bg-[#4338CA] px-7 text-[15px] font-bold text-white no-underline shadow-[0_10px_24px_rgba(67,56,202,0.24)] transition hover:border-[#3730A3] hover:bg-[#3730A3] active:border-[#312E81] active:bg-[#312E81]';

  return (
    <aside
      aria-label="GARIM Alert"
      className={cx(
        'relative flex min-h-[560px] w-full max-w-[390px] animate-[garim-alert-modal-enter_550ms_ease-out_both] flex-col overflow-hidden rounded-[34px] border border-white/12 bg-[#070724]/94 text-white shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl motion-reduce:animate-none',
        className
      )}
    >
      <style>
        {`
          @keyframes garim-alert-modal-enter {
            from {
              opacity: 0;
              transform: translateY(24px) scale(0.985);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 52% 24%, ${hexToRgba(palette.accentColor, 0.2)}, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.05), transparent 42%)`,
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-120px] top-0 h-full w-[210px] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)] blur-sm"
      />

      <header className="relative flex h-14 items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold tracking-[0.08em] text-white">GARIM</span>
          <span className="text-sm font-bold text-white/88">ALARM</span>
        </div>

        {onClose ? (
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-white/72 transition hover:bg-white/10 hover:text-white"
          >
            <CloseIcon />
          </button>
        ) : null}
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-10">
        {renderOrb ? renderOrb({ statusKey }) : <GarimAlertOrb statusKey={statusKey} />}

        <div className="mt-8 text-center">
          <p className="m-0 text-[15px] font-bold leading-7 text-white">{headline}</p>
          <p className="m-0 mt-1 text-[15px] font-bold leading-7 text-white/92">{detail}</p>
        </div>

        {renderCta ? (
          renderCta({
            className: ctaClassName,
            href: resolvedCtaHref,
            label: ctaLabel,
          })
        ) : (
          <a href={resolvedCtaHref} onClick={onCtaClick} className={ctaClassName}>
            {ctaLabel}
          </a>
        )}
      </div>
    </aside>
  );
}
