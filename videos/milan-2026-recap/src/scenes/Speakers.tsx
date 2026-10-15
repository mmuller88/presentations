import { AbsoluteFill } from 'remotion'
import { HEADS } from '../assets'
import { ACCENT } from '../brand'
import { Mark } from '../components/LogoPlate'
import { Reveal } from '../components/Reveal'
import { SpeakerCard } from '../components/SpeakerCard'
import { COPY, POPS, SPEAKERS, atBeat } from '../script'

export const Speakers: React.FC = () => (
  <AbsoluteFill className="overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,#6b21a8_0%,#3b0764_40%,#1a1033_100%)]">
    <Mark />
    <div className="absolute top-[36px] right-[48px] left-[40px]">
      <div className="font-mono text-[16px] font-bold tracking-[0.2em] text-pink uppercase">Main stage</div>
      <div className="mt-1 font-display text-[52px] leading-none font-extrabold tracking-[-0.04em] text-white">
        <Reveal line={COPY.speakers.line} delay={2} accentClassName={ACCENT} />
      </div>
    </div>
    <div className="absolute top-[160px] right-[28px] bottom-[28px] left-[28px] grid grid-cols-3 grid-rows-3 gap-3">
      {SPEAKERS.map((speaker, i) => (
        <SpeakerCard
          key={speaker.names}
          names={speaker.names}
          topic={speaker.topic}
          photos={speaker.photos.map((file) => HEADS[file])}
          delay={atBeat(POPS.speakers[i])}
        />
      ))}
    </div>
  </AbsoluteFill>
)
