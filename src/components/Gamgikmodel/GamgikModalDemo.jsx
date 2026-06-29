import GamgikAgentOrbWithFace from './GamgikAgentOrbWithFace.jsx';

export default function GamgikModalDemo() {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center overflow-hidden">
      <div className="relative h-[460px] w-[460px] shrink-0 overflow-visible">
        <GamgikAgentOrbWithFace
          size={460}
          speed={10}
          motion={0.78}
          statusKey="normal"
        />
      </div>
    </section>
  );
}
