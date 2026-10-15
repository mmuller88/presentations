import { Img, useCurrentFrame } from 'remotion'
import { progress } from '../lib/anim'

/** White plate so the dark ServerlessDays wordmark reads on a photo. */
export const LogoPlate: React.FC<{ src: string; imgClassName?: string }> = ({ src, imgClassName = 'h-[48px] w-auto' }) => {
  const frame = useCurrentFrame()
  const p = progress(frame, 0, 12)

  return (
    <div
      className="inline-flex items-center rounded-2xl bg-white px-5 py-3 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.55)]"
      style={{ opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}
    >
      <Img src={src} className={imgClassName} />
    </div>
  )
}

export const Mark: React.FC<{ light?: boolean }> = ({ light = false }) => {
  const frame = useCurrentFrame()
  return (
    <div
      className={`absolute top-[36px] right-[40px] font-mono text-[16px] font-bold tracking-[0.16em] ${light ? 'text-ink/45' : 'text-white/70'}`}
      style={{ opacity: progress(frame, 0, 12) }}
    >
      MILANO · 13 OCT
    </div>
  )
}
