import { AbsoluteFill, Freeze, Img } from 'remotion'
import { ASSETS } from './assets'
import { Hook } from './scenes/Hook'
import { BEATS, sec } from './script'

/** LinkedIn poster: the settled hook frame plus the Milano unicorn. */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill>
    <Freeze frame={sec(BEATS.hook) - 1}>
      <Hook poster />
    </Freeze>
    <Img src={ASSETS.unicorn} className="absolute right-[28px] bottom-[44px] h-[420px] w-auto drop-shadow-[0_24px_40px_rgba(0,0,0,0.5)]" />
  </AbsoluteFill>
)
