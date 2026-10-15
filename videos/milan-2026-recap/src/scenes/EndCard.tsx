import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion'
import { ASSETS } from '../assets'
import { ACCENT } from '../brand'
import { Qr } from '../components/Qr'
import { Reveal } from '../components/Reveal'
import { pop, progress } from '../lib/anim'
import { COPY, SLIDES_URL } from '../script'

const STRIPES = ['bg-italy-green', 'bg-italy-white', 'bg-italy-red']

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const dino = pop(frame, fps, 0, 12)
  const qr = pop(frame, fps, 16, 13)

  return (
    <AbsoluteFill className="overflow-hidden bg-[radial-gradient(ellipse_at_50%_38%,#6b21a8_0%,#3b0764_55%,#1a1033_100%)]">
      <AbsoluteFill className="flex-col items-center pt-[64px]">
        <Img
          src={ASSETS.dino}
          className="h-[210px] w-auto"
          style={{ opacity: Math.min(1, dino * 2), transform: `scale(${dino})` }}
        />
        <div className="mt-2 font-display text-[72px] leading-none font-extrabold tracking-[-0.04em] text-white">
          <Reveal line={COPY.end.line} delay={6} accentClassName={ACCENT} />
        </div>
        <div
          className="mt-6 rounded-[28px] bg-white p-5"
          style={{ opacity: Math.min(1, qr * 2), transform: `scale(${0.92 + 0.08 * Math.min(1, qr)})` }}
        >
          <Qr value={SLIDES_URL} size={280} className="fill-ink" />
        </div>
        <div className="mt-4 font-mono text-[20px] tracking-wide text-lavender" style={{ opacity: progress(frame, 28, 14) }}>
          {COPY.end.slides}
        </div>
        <div className="mt-5 font-display text-[32px] font-bold text-white" style={{ opacity: progress(frame, 36, 14) }}>
          {COPY.end.next}
        </div>
        <div className="mt-2 font-mono text-[24px] font-bold tracking-[0.04em] text-pink">{COPY.end.host}</div>
      </AbsoluteFill>
      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        {STRIPES.map((color, i) => (
          <span key={color} className={`h-[14px] origin-left ${color}`} style={{ transform: `scaleX(${progress(frame, 8 + i * 3, 18)})` }} />
        ))}
      </div>
    </AbsoluteFill>
  )
}
