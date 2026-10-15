import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion'
import { ASSETS } from '../assets'
import { ACCENT_INK } from '../brand'
import { Mark } from '../components/LogoPlate'
import { Reveal } from '../components/Reveal'
import { pop } from '../lib/anim'
import { COPY, POPS, atBeat } from '../script'

const Plate: React.FC<{ src: string; delay: number; tall?: boolean }> = ({ src, delay, tall = false }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = pop(frame, fps, delay, 13)
  const shown = Math.min(1, s)

  return (
    <div
      className={`flex items-center justify-center rounded-3xl bg-plum px-6 shadow-[0_22px_44px_-24px_rgba(88,28,135,0.85)] ${tall ? 'h-[168px]' : 'h-[150px]'}`}
      style={{ opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - shown) * 18}px)` }}
    >
      <Img src={src} className="h-[76px] w-auto max-w-full" />
    </div>
  )
}

export const Sponsors: React.FC = () => (
  <AbsoluteFill className="overflow-hidden bg-[radial-gradient(ellipse_at_50%_30%,#ffffff_0%,#f4f1ea_62%,#f3e8ff_100%)]">
    <Mark light />
    <div className="absolute inset-x-[72px] top-1/2 -translate-y-1/2">
      <div className="font-mono text-[18px] font-bold tracking-[0.22em] text-violet uppercase">Sponsors</div>
      <div className="mt-3 font-display text-[64px] leading-[0.95] font-extrabold tracking-[-0.04em] text-ink">
        <Reveal line={COPY.sponsors.lines[0]} delay={4} />
        <Reveal line={COPY.sponsors.lines[1]} delay={12} accentClassName={ACCENT_INK} />
      </div>

      <div className="mt-8 font-mono text-[16px] font-bold tracking-[0.2em] text-violet uppercase">{COPY.sponsors.headline}</div>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <Plate src={ASSETS.eleva} delay={atBeat(POPS.sponsors[0])} />
        <Plate src={ASSETS.besharp} delay={atBeat(POPS.sponsors[1])} />
      </div>

      <div className="mt-6 font-mono text-[16px] font-bold tracking-[0.2em] text-violet uppercase">{COPY.sponsors.gold}</div>
      <div className="mt-3">
        <Plate src={ASSETS.docebo} delay={atBeat(POPS.sponsors[2])} tall />
      </div>
    </div>
  </AbsoluteFill>
)
