import type { BeatId } from '../script'
import { Crew } from './Crew'
import { EndCard } from './EndCard'
import { Hook } from './Hook'
import { Host } from './Host'
import { Keynotes } from './Keynotes'
import { MyTalk } from './MyTalk'
import { Speakers } from './Speakers'
import { Sponsors } from './Sponsors'

export const SCENE_COMPONENTS: Record<BeatId, React.FC> = {
  hook: Hook,
  crew: Crew,
  host: Host,
  sponsors: Sponsors,
  keynotes: Keynotes,
  speakers: Speakers,
  mytalk: MyTalk,
  end: EndCard,
}
