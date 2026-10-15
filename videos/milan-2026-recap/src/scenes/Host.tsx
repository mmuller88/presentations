import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion'
import { ASSETS } from '../assets'
import { ACCENT } from '../brand'
import { Chip } from '../components/Chip'
import { Mark } from '../components/LogoPlate'
import { Polaroid } from '../components/Polaroid'
import { Reveal } from '../components/Reveal'
import { pop, progress } from '../lib/anim'
import { COPY, POPS, atBeat } from '../script'

export const Host: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const uni = pop(frame, fps, atBeat(1), 14)

  return (
    <AbsoluteFill className="overflow-hidden bg-[radial-gradient(ellipse_at_50%_12%,#4c1d95_0%,#2e1065_48%,#1a1033_100%)]">
      <Mark />
      <div className="absolute top-[64px] left-0 flex w-full justify-center">
        <Polaroid src={ASSETS.venue} caption={COPY.host.caption} tilt={2} imgClassName="h-[390px] w-[760px] object-[center_42%]" />
      </div>
      <Img
        src={ASSETS.unicorn}
        className="absolute top-[700px] right-[8px] h-[280px] w-auto"
        style={{ opacity: Math.min(1, uni), transform: `scale(${0.9 + 0.1 * Math.min(1, uni)})` }}
      />
      <div className="absolute top-[620px] right-[250px] left-[64px]">
        <Img src={ASSETS.overnet} className="h-[64px] w-auto" style={{ opacity: progress(frame, 4, 12) }} />
        <div className="mt-4 font-display text-[60px] leading-[0.95] font-extrabold tracking-[-0.04em] text-white">
          <Reveal line={COPY.host.line} delay={8} accentClassName={ACCENT} />
        </div>
        <div className="mt-4 font-display text-[36px] leading-tight font-bold text-white">
          <Reveal line={COPY.host.volunteer} delay={atBeat(2)} accentClassName={ACCENT} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {COPY.host.chips.map((text, i) => (
            <Chip key={text} text={text} delay={atBeat(POPS.host[i])} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  )
}
