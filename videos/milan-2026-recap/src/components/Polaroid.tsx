import { Img, useCurrentFrame, useVideoConfig } from 'remotion'
import { pop } from '../lib/anim'

/** Tilted print with a caption in the bottom margin. */
export const Polaroid: React.FC<{
  src: string
  caption: string
  tilt?: number
  delay?: number
  imgClassName: string
}> = ({ src, caption, tilt = -2.5, delay = 0, imgClassName }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = pop(frame, fps, delay, 14)

  return (
    <div
      className="relative bg-white px-4 pt-4 pb-16 shadow-[0_28px_70px_-24px_rgba(0,0,0,0.7)]"
      style={{ opacity: Math.min(1, s * 2), transform: `rotate(${tilt}deg) scale(${0.94 + 0.06 * Math.min(1, s)})` }}
    >
      <Img src={src} className={`object-cover ${imgClassName}`} />
      <div className="absolute inset-x-0 bottom-4 text-center font-mono text-[22px] font-medium tracking-wide text-ink/70">{caption}</div>
    </div>
  )
}
