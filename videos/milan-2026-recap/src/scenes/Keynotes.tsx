import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion'
import { ASSETS, HEADS } from '../assets'
import { Photo } from '../components/Photo'
import { pop } from '../lib/anim'
import { KEYNOTES, POPS, atBeat } from '../script'

const Card: React.FC<{
  name: string
  org: string
  title: string
  photo: string
  chip?: string
  delay: number
}> = ({ name, org, title, photo, chip, delay }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = pop(frame, fps, delay, 13)
  const shown = Math.min(1, s)

  return (
    <div
      className="flex items-center gap-5 rounded-[28px] bg-night/85 px-5 py-4 ring-1 ring-white/15"
      style={{ opacity: Math.min(1, s * 1.4), transform: `translateY(${(1 - shown) * 24}px)` }}
    >
      <Img src={HEADS[photo]} className="h-[108px] w-[108px] shrink-0 rounded-full object-cover ring-[3px] ring-pink" />
      <div className="min-w-0">
        <div className="font-display text-[34px] leading-none font-extrabold tracking-[-0.03em] text-white">{name}</div>
        <div className="mt-1 font-mono text-[15px] tracking-[0.08em] text-lavender uppercase">{org}</div>
        <div className="mt-2 font-display text-[24px] leading-tight font-semibold text-white">{title}</div>
        {chip ? (
          <div className="mt-2 inline-flex rounded-full bg-pink/15 px-3 py-1 font-mono text-[15px] font-bold tracking-wide text-pink ring-1 ring-pink/40">
            {chip}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export const Keynotes: React.FC = () => (
  <AbsoluteFill className="overflow-hidden bg-night">
    <Photo src={ASSETS.stage} from={1.02} to={1.08} fit="object-[center_40%]" />
    <AbsoluteFill className="bg-[linear-gradient(180deg,rgba(26,16,51,0.2)_0%,rgba(26,16,51,0.05)_34%,rgba(26,16,51,0.78)_62%,rgba(16,6,32,0.96)_100%)]" />
    <div className="absolute top-[48px] left-[48px] font-mono text-[18px] font-bold tracking-[0.22em] text-pink uppercase">Keynotes</div>
    <div className="absolute right-[36px] bottom-[48px] left-[36px] flex flex-col gap-4">
      {KEYNOTES.map((card, i) => (
        <Card key={card.name} {...card} delay={atBeat(POPS.keynotes[i])} />
      ))}
    </div>
  </AbsoluteFill>
)
