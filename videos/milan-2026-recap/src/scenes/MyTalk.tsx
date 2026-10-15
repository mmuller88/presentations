import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion'
import { ASSETS } from '../assets'
import { ACCENT } from '../brand'
import { Flow } from '../components/Flow'
import { Mark } from '../components/LogoPlate'
import { Reveal } from '../components/Reveal'
import { pop, progress } from '../lib/anim'
import { COPY, FLOW, FLOW_HOPS, atBeat } from '../script'

export const MyTalk: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const avatar = pop(frame, fps, 0, 12)

  return (
    <AbsoluteFill className="overflow-hidden bg-[radial-gradient(ellipse_at_50%_18%,#4c1d95_0%,#2e1065_50%,#1a1033_100%)]">
      <Mark />
      <div className="absolute top-[200px] right-[48px] left-[48px] flex flex-col items-center text-center">
        <Img
          src={ASSETS.avatar}
          className="h-[148px] w-[148px] rounded-full object-cover ring-[5px] ring-pink"
          style={{ opacity: Math.min(1, avatar * 2), transform: `scale(${avatar})` }}
        />
        <div className="mt-5 font-mono text-[18px] font-bold tracking-[0.2em] text-pink uppercase">{COPY.mytalk.kicker}</div>
        <div className="mt-3 font-display text-[68px] leading-[0.95] font-extrabold tracking-[-0.04em] text-white">
          <Reveal line={COPY.mytalk.lines[0]} delay={6} />
          <Reveal line={COPY.mytalk.lines[1]} delay={14} accentClassName={ACCENT} />
        </div>
        <div className="mt-4 font-mono text-[26px] text-lavender" style={{ opacity: progress(frame, atBeat(2.2), 14) }}>
          {COPY.mytalk.thanks}
        </div>
      </div>
      <div className="absolute top-[760px] left-1/2 -translate-x-1/2">
        <Flow nodes={FLOW} hops={FLOW_HOPS} />
      </div>
    </AbsoluteFill>
  )
}
