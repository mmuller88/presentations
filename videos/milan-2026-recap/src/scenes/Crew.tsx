import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { ASSETS } from '../assets'
import { ACCENT } from '../brand'
import { Mark } from '../components/LogoPlate'
import { Polaroid } from '../components/Polaroid'
import { Reveal } from '../components/Reveal'
import { pop, progress } from '../lib/anim'
import { COPY, POPS, atBeat } from '../script'

const Name: React.FC<{ name: string; delay: number }> = ({ name, delay }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = pop(frame, fps, delay, 13)
  const shown = Math.min(1, s)

  return (
    <div className="flex items-center gap-4" style={{ opacity: Math.min(1, s * 1.5), transform: `translateX(${(1 - shown) * 28}px)` }}>
      <span className="h-[12px] w-[12px] rounded-full bg-pink" />
      <span className="font-display text-[40px] font-bold tracking-[-0.02em] text-white">{name}</span>
    </div>
  )
}

export const Crew: React.FC = () => {
  const frame = useCurrentFrame()
  const [dinnerAt, ...namesAt] = POPS.crew

  return (
    <AbsoluteFill className="overflow-hidden bg-[radial-gradient(ellipse_at_50%_18%,#6b21a8_0%,#3b0764_46%,#1a1033_100%)]">
      <Mark />
      <div className="absolute top-[104px] left-0 flex w-full justify-center">
        <Polaroid src={ASSETS.team} caption={COPY.crew.team} tilt={-1.5} imgClassName="h-[640px] w-[960px] object-[40%_center]" />
      </div>
      <div className="absolute top-[790px] right-[48px]">
        <Polaroid
          src={ASSETS.dinner}
          caption={COPY.crew.dinner}
          tilt={4}
          delay={atBeat(dinnerAt)}
          imgClassName="h-[300px] w-[240px] object-[center_30%]"
        />
      </div>
      <div className="absolute top-[880px] left-[72px]">
        <div className="font-display text-[72px] leading-none font-extrabold tracking-[-0.04em] text-white">
          <Reveal line={COPY.crew.line} delay={6} accentClassName={ACCENT} />
        </div>
        <div className="mt-5 flex flex-col gap-2">
          {COPY.crew.names.map((name, i) => (
            <Name key={name} name={name} delay={atBeat(namesAt[i])} />
          ))}
        </div>
        <div className="mt-5 font-mono text-[22px] tracking-wide text-lavender" style={{ opacity: progress(frame, atBeat(6.2), 12) }}>
          {COPY.crew.sub}
        </div>
      </div>
    </AbsoluteFill>
  )
}
