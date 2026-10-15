import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion'

/** Full-bleed photo with a slow Ken Burns push. */
export const Photo: React.FC<{
  src: string
  from?: number
  to?: number
  /** Tailwind object-position class, e.g. object-[center_30%]. */
  fit?: string
}> = ({ src, from = 1, to = 1.08, fit = 'object-center' }) => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const scale = from + ((to - from) * frame) / Math.max(1, durationInFrames - 1)

  return (
    <AbsoluteFill className="overflow-hidden">
      <div className="absolute inset-0" style={{ transform: `scale(${scale})` }}>
        <Img src={src} className={`h-full w-full object-cover ${fit}`} />
      </div>
    </AbsoluteFill>
  )
}
