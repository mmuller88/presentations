import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { ASSETS } from '../assets'
import { ACCENT } from '../brand'
import { Chip } from '../components/Chip'
import { LogoPlate } from '../components/LogoPlate'
import { Photo } from '../components/Photo'
import { Reveal } from '../components/Reveal'
import { COPY, MORSE, POPS, atBeat } from '../script'

/** `-.-. .. .- ---` typed in time with the telegraph beeps. */
const Ticker: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame / fps
  const letters = ['C', 'I', 'A', 'O']

  return (
    <div className="absolute top-[164px] left-0 flex w-full justify-center">
      <div className="flex items-center gap-5 rounded-full bg-night/80 px-6 py-3 ring-1 ring-white/20">
        {letters.map((letter) => (
          <span key={letter} className="flex items-center gap-[5px]">
            {MORSE.filter((event) => event.letter === letter).map((event) => {
              const on = t >= event.t
              const live = on && t < event.t + event.dur
              const tone = live ? 'bg-pink' : on ? 'bg-lavender' : 'bg-white/30'
              const shape = event.symbol === '-' ? 'h-[8px] w-[26px]' : 'h-[8px] w-[8px]'
              return <span key={event.index} className={`rounded-full ${tone} ${shape}`} />
            })}
          </span>
        ))}
      </div>
    </div>
  )
}

/** `poster` enlarges the kicker for the thumbnail. */
export const Hook: React.FC<{ poster?: boolean }> = ({ poster = false }) => (
  <AbsoluteFill className="overflow-hidden bg-night">
    <Photo src={ASSETS.lobby} from={1.05} to={1.14} fit="object-[center_62%]" />
    <AbsoluteFill className="bg-[linear-gradient(180deg,rgba(26,16,51,0.42)_0%,rgba(26,16,51,0.08)_30%,rgba(49,16,88,0.55)_64%,rgba(26,8,48,0.94)_100%)]" />
    <div className="absolute top-[56px] left-0 flex w-full justify-center">
      <LogoPlate src={ASSETS.logo} />
    </div>
    <Ticker />
    <div className="absolute right-[64px] bottom-[110px] left-[64px]">
      <div
        className={`font-mono font-bold text-pink uppercase ${poster ? 'text-[44px] leading-tight tracking-[0.14em]' : 'text-[20px] tracking-[0.22em]'}`}
      >
        {COPY.hook.kicker}
      </div>
      <div className="mt-3 font-display text-[92px] leading-[0.92] font-extrabold tracking-[-0.04em] text-white">
        <Reveal line={COPY.hook.line} delay={8} accentClassName={ACCENT} />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        {COPY.hook.chips.map((text, i) => (
          <Chip key={text} text={text} delay={atBeat(POPS.hook[i])} />
        ))}
      </div>
    </div>
  </AbsoluteFill>
)
