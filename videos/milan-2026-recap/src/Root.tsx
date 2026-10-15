import './style.css'
import './fonts'
import { Composition, Folder } from 'remotion'
import { MilanRecap } from './MilanRecap'
import { SCENE_COMPONENTS } from './scenes'
import { BEATS, FPS, HEIGHT, SCENES, TOTAL_FRAMES, WIDTH, sec } from './script'
import { Thumbnail } from './Thumbnail'

export const Root: React.FC = () => (
  <>
    <Composition id="MilanRecap" component={MilanRecap} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* Remotion clamps frames to the duration, so <Freeze> needs the full hook length. */}
    <Composition id="Thumbnail" component={Thumbnail} durationInFrames={sec(BEATS.hook)} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Folder name="Beats">
      {SCENES.map(({ id, frames }) => (
        <Composition key={id} id={`Beat-${id}`} component={SCENE_COMPONENTS[id]} durationInFrames={frames} fps={FPS} width={WIDTH} height={HEIGHT} />
      ))}
    </Folder>
  </>
)
