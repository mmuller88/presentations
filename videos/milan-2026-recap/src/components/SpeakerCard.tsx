import { Img, useCurrentFrame, useVideoConfig } from 'remotion'
import { pop } from '../lib/anim'

/** Headshot, name and topic. Two photos overlap for joint talks. */
export const SpeakerCard: React.FC<{
  names: string
  topic: string
  photos: readonly string[]
  delay: number
}> = ({ names, topic, photos, delay }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = pop(frame, fps, delay, 14)
  const shown = Math.min(1, s)

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-2 rounded-3xl bg-white/10 px-3 py-3 ring-1 ring-white/15"
      style={{ opacity: Math.min(1, s * 1.6), transform: `translateY(${(1 - shown) * 18}px) scale(${0.94 + 0.06 * shown})` }}
    >
      <div className="flex items-center justify-center">
        {photos.map((src, i) => (
          <Img
            key={src}
            src={src}
            className={`h-[84px] w-[84px] rounded-full object-cover ring-[3px] ring-plum-deep ${i > 0 ? '-ml-5' : ''}`}
          />
        ))}
      </div>
      <div className="text-center font-display text-[22px] leading-[1.05] font-bold text-white">{names}</div>
      <div className="text-center font-mono text-[15px] leading-tight tracking-wide text-lavender">{topic}</div>
    </div>
  )
}
