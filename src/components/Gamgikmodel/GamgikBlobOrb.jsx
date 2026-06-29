'use client';

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const ORB_THEMES = {
  normal: {
    bodyTop: '#343CA8',
    bodyMid: '#20246D',
    bodyBottom: '#080B24',
    rimWhite: '#F6F0FF',
    rimPurple: '#A58BFF',
    bottomBlue: '#4E6BFF',
    outerGlow: '#8B6CFF',
  },
  allow: {
    bodyTop: '#0891B2',
    bodyMid: '#155E75',
    bodyBottom: '#061923',
    rimWhite: '#ECFEFF',
    rimPurple: '#67E8F9',
    bottomBlue: '#22D3EE',
    outerGlow: '#06B6D4',
  },
  masking: {
    bodyTop: '#B45309',
    bodyMid: '#7C2D12',
    bodyBottom: '#1F1305',
    rimWhite: '#FFF7ED',
    rimPurple: '#FDBA74',
    bottomBlue: '#F59E0B',
    outerGlow: '#F97316',
  },
  block: {
    bodyTop: '#B91C1C',
    bodyMid: '#7F1D1D',
    bodyBottom: '#210707',
    rimWhite: '#FFF1F2',
    rimPurple: '#FDA4AF',
    bottomBlue: '#FF4D4F',
    outerGlow: '#F43F5E',
  },
};

function OrbPlane({ speed = 0.95, motion = 0.78, statusKey = 'normal' }) {
  const materialRef = useRef(null);
  const groupRef = useRef(null);
  const { size } = useThree();
  const theme = ORB_THEMES[statusKey] ?? ORB_THEMES.normal;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uMotion: { value: motion },

      uBodyTop: { value: new THREE.Color(theme.bodyTop) },
      uBodyMid: { value: new THREE.Color(theme.bodyMid) },
      uBodyBottom: { value: new THREE.Color(theme.bodyBottom) },

      uRimWhite: { value: new THREE.Color(theme.rimWhite) },
      uRimPurple: { value: new THREE.Color(theme.rimPurple) },
      uBottomBlue: { value: new THREE.Color(theme.bottomBlue) },
      uOuterGlow: { value: new THREE.Color(theme.outerGlow) },
    }),
    [motion, theme]
  );

  useFrame(state => {
    const elapsed = state.clock.getElapsedTime();
    const t = elapsed * speed;

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
      materialRef.current.uniforms.uAspect.value = size.width / size.height;
      materialRef.current.uniforms.uMotion.value = motion;
      materialRef.current.uniforms.uBodyTop.value.set(theme.bodyTop);
      materialRef.current.uniforms.uBodyMid.value.set(theme.bodyMid);
      materialRef.current.uniforms.uBodyBottom.value.set(theme.bodyBottom);
      materialRef.current.uniforms.uRimWhite.value.set(theme.rimWhite);
      materialRef.current.uniforms.uRimPurple.value.set(theme.rimPurple);
      materialRef.current.uniforms.uBottomBlue.value.set(theme.bottomBlue);
      materialRef.current.uniforms.uOuterGlow.value.set(theme.outerGlow);
    }

    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.55) * 0.022;
      groupRef.current.rotation.z = Math.sin(t * 0.18) * 0.01;
      groupRef.current.scale.x = 1.0 + Math.sin(t * 0.42) * 0.004;
      groupRef.current.scale.y = 1.0 + Math.cos(t * 0.38) * 0.006;
    }
  });

  const vertexShader = `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;

    uniform float uTime;
    uniform float uAspect;
    uniform float uMotion;

    uniform vec3 uBodyTop;
    uniform vec3 uBodyMid;
    uniform vec3 uBodyBottom;
    uniform vec3 uRimWhite;
    uniform vec3 uRimPurple;
    uniform vec3 uBottomBlue;
    uniform vec3 uOuterGlow;

    mat2 rotate2d(float a) {
      float s = sin(a);
      float c = cos(a);
      return mat2(c, -s, s, c);
    }

    float sphereRadius(float angle, float t) {
      float r = 0.585;

      // 구체 실루엣은 유지하면서 외곽만 부드럽게 움직임
      r += uMotion * 0.020 * sin(angle * 2.0 + t * 0.28);
      r += uMotion * 0.014 * sin(angle * 3.0 - t * 0.22 + 1.3);
      r += uMotion * 0.010 * sin(angle * 5.0 + t * 0.18 + 2.2);

      // 전체 호흡감
      r += uMotion * 0.010 * sin(t * 0.42);

      return r;
    }

    float orbSDF(vec2 p, float t) {
      p.x += sin(t * 0.19) * 0.004;
      p.y += cos(t * 0.17) * 0.003;

      float angle = atan(p.y, p.x);
      float radius = length(p);

      float r = sphereRadius(angle, t);

      // 아래쪽 무게감
      r += 0.008 * smoothstep(0.08, -0.72, p.y);

      return radius - r;
    }

    void main() {
      float t = uTime;

      vec2 uv = vUv;
      vec2 p = uv - 0.5;
      p *= 2.0;
      p.x *= uAspect;

      // 거의 구체 형태 유지
      p.x *= 0.985;
      p.y *= 1.015;

      // 아주 약한 회전감
      float rot = sin(t * 0.14) * 0.028 * uMotion;
      p = rotate2d(rot) * p;

      float d = orbSDF(p, t);

      // 내부 마스크
      float inside = 1.0 - smoothstep(0.0, 0.012, d);

      // 외곽 림
      float rim = 1.0 - smoothstep(0.0, 0.052, abs(d));

      // 바깥 글로우를 조금 더 부드럽게
      float outsideD = max(d, 0.0);
      float outerGlow = exp(-outsideD * 18.0);
      outerGlow *= 1.0 - smoothstep(0.025, 0.24, outsideD);

      // 가짜 구면 좌표
      float baseR = 0.585;
      vec2 sp = p / baseR;
      float rr = dot(sp, sp);
      float z = sqrt(max(0.0, 1.0 - rr));

      vec3 N = normalize(vec3(sp.x, sp.y, z));
      vec3 V = vec3(0.0, 0.0, 1.0);

      vec3 lightTop = normalize(vec3(-0.42, 0.82, 0.38));
      float diffuseTop = max(dot(N, lightTop), 0.0);

      float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.45);

      // 내부 바디 톤: 기존보다 밝고 부드럽게
      float vertical = smoothstep(-0.82, 0.74, p.y);
      vec3 body = mix(uBodyBottom, uBodyTop, vertical * 0.92);
      body = mix(body, uBodyMid, 0.34);

      // 중앙 어둠을 너무 강하지 않게 낮춤
      float centerShade = smoothstep(0.78, 0.08, length(p));
      body -= vec3(0.014, 0.012, 0.026) * centerShade;

      // 구면 입체감
      body += uBodyTop * diffuseTop * 0.11;
      body += vec3(0.018, 0.020, 0.052) * z * 0.34;

      // 내부 미세 생동감
      float innerPulse = 0.5 + 0.5 * sin(t * 0.65 + p.y * 3.0);
      vec3 innerShift = vec3(0.018, 0.018, 0.052) * innerPulse * 0.16;

      // 보라색 외곽 림
      float purpleRim = fresnel * 0.56 + rim * 0.18;
      purpleRim *= smoothstep(-0.64, 0.9, p.y);

      // 아래 블루 림
      float bottomMask = smoothstep(0.14, -0.84, p.y);
      float bottomPulse = 0.88 + 0.12 * sin(t * 0.82);
      float bottomGlow = (fresnel * 0.88 + rim * 0.36) * bottomMask * bottomPulse;

      /*
        중앙 소프트 글로우
        - 위쪽 하얀 스팟 대신 중앙에 은은한 라벤더 빛
        - 너무 밝지 않지만 전체가 부드러워 보이게
      */
      vec2 centerGlowPos = vec2(0.0, 0.02);
      vec2 centerGlowUv = p - centerGlowPos;

      centerGlowUv.x *= 0.92;
      centerGlowUv.y *= 1.12;

      float centerGlow = 1.0 - smoothstep(0.0, 0.40, length(centerGlowUv));
      centerGlow *= inside;

      float centerDepth = smoothstep(0.72, 0.05, length(p));
      centerGlow *= centerDepth;

      float centerPulse = 0.92 + 0.08 * sin(t * 0.72);
      centerGlow *= centerPulse;

      // 기존보다 살짝 더 보이게
      centerGlow *= 0.24;

      vec3 color = body + innerShift;

      // 전체적으로 색감이 더 또렷하게 보이도록 강도 상승
      color += uRimPurple * purpleRim * 0.64;
      color += uBottomBlue * bottomGlow * 1.08;

      vec3 centerGlowColor = mix(uRimPurple, uRimWhite, 0.56);
      color += centerGlowColor * centerGlow * 1.12;

      // 바깥 퍼플 헤이즈
      color += uOuterGlow * outerGlow * 0.18;

      float alpha = inside;
      alpha = max(alpha, outerGlow * 0.24);
      alpha = clamp(alpha, 0.0, 1.0);

      gl_FragColor = vec4(color, alpha);
    }
  `;

  return (
    <group ref={groupRef}>
      <mesh>
        <planeGeometry args={[3.2, 3.2]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>
    </group>
  );
}

export function GarimReferenceOrb({
  size = 460,
  className = '',
  background = 'transparent',
  speed = 0.95,
  motion = 0.78,
  statusKey = 'normal',
}) {
  return (
    <div
      className={`garim-reference-orb ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        background,
        '--orb-speed': speed,
      }}
    >
      <Canvas
        orthographic
        camera={{ zoom: 120, position: [0, 0, 5] }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <OrbPlane speed={speed} motion={motion} statusKey={statusKey} />
      </Canvas>

      <div className="garim-orb-bottom-glow" />

      <style>{`
        .garim-reference-orb {
          position: relative;
          display: grid;
          place-items: center;
          isolation: isolate;
          overflow: visible;
          pointer-events: none;
        }

        .garim-reference-orb canvas {
          position: relative;
          z-index: 2;
        }

        .garim-orb-bottom-glow {
          position: absolute;
          left: 50%;
          bottom: 14.5%;
          width: 30%;
          height: 6%;
          transform: translateX(-50%);
          border-radius: 999px;
          background: radial-gradient(
            ellipse,
            rgba(78, 107, 255, 0.56) 0%,
            rgba(139, 108, 255, 0.22) 42%,
            rgba(78, 107, 255, 0.0) 76%
          );
          filter: blur(17px);
          z-index: 1;
          animation: garimOrbFloorGlow calc(6.6s / var(--orb-speed)) ease-in-out infinite;
        }

        @keyframes garimOrbFloorGlow {
          0%, 100% {
            opacity: 0.44;
            transform: translateX(-50%) scaleX(0.92);
          }

          50% {
            opacity: 0.82;
            transform: translateX(-50%) scaleX(1.08);
          }
        }
      `}</style>
    </div>
  );
}

export default function GarimReferenceOrbPreview() {
  return (
    <div
      style={{
        minHeight: '100vh',
        margin: 0,
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(circle at 50% 48%, rgba(88, 64, 190, 0.22), rgba(9, 7, 24, 0.92) 44%, #03040a 100%)',
      }}
    >
      <GarimReferenceOrb size={460} speed={0.95} motion={0.78} />
    </div>
  );
}
