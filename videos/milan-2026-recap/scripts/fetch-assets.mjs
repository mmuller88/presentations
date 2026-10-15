// Copies the Dropbox photos and pulls public conference assets (speaker
// headshots, sponsor marks, deck logos). Photos stay gitignored.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const deck = fileURLToPath(new URL('../../../milan-2026-ai-factory/assets/', import.meta.url))
const pics = '/Users/martin/Library/CloudStorage/Dropbox/Conference/2026/Oct_13_Milan_ServerlessDays/pics'

const PHOTOS = ['julian.jpeg', 'lobby-1.jpeg', 'orgas.jpeg', 'sponsors.jpeg', 'vincenzo-and-me.jpeg']

const SPEAKERS = [
  'alberto-ossola.jpg',
  'alessandro-frangioni.jpg',
  'andrea-bartilucci.jpg',
  'andrea-ricci.jpg',
  'daniele-frasca.jpeg',
  'davide-de-sio.jpeg',
  'diego-rossi.jpeg',
  'giulia-scalaberni.jpeg',
  'julian-wood.jpeg',
  'luca-ippolito.jpeg',
  'luca-mezzalira.jpeg',
  'martin-mueller.jpeg',
  'nicola-racco.jpeg',
  'tommaso-stocchi.jpg',
]

const DECK = {
  'serverlessdays-logo.png': 'logos/serverlessdays-logo.png',
  'openclaw-logo.svg': 'logos/openclaw-logo.svg',
  'unicorn-mascot.svg': 'logos/unicorn-mascot.svg',
  'dino-mascot.svg': 'logos/dino-mascot.svg',
  'martin-mueller.jpg': 'logos/martin-mueller.jpg',
}

const mkdir = (path) => mkdirSync(path, { recursive: true })

const save = async (url, path) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  mkdir(dirname(path))
  writeFileSync(path, buf)
  console.log(`${buf.length.toString().padStart(8)}  ${path.slice(root.length)}`)
}

mkdir(join(root, 'assets/photos'))
for (const name of PHOTOS) {
  const from = join(pics, name)
  const to = join(root, 'assets/photos', name)
  copyFileSync(from, to)
  console.log(`copied  ${name}`)
}

const site = 'https://milan.serverlessdays.io'
for (const name of SPEAKERS) {
  await save(`${site}/speakers/${name}`, join(root, 'assets/speakers', name))
}

const html = await (await fetch(site)).text()
const bundlePath = html.match(/assets\/index-[^"]+\.js/)?.[0]
if (!bundlePath) throw new Error('site bundle not found')
const bundle = await (await fetch(`${site}/${bundlePath}`)).text()

const dataUri = (name) => {
  const at = bundle.indexOf(`${name}="data:image/svg+xml,`)
  if (at < 0) throw new Error(`no data uri for ${name}`)
  const start = bundle.indexOf('"', at) + 1
  const end = bundle.indexOf('"', start)
  return decodeURIComponent(bundle.slice(start, end).replace(/^data:image\/svg\+xml,/, ''))
}

writeFileSync(join(root, 'assets/logos/eleva.svg'), dataUri('iC'))
writeFileSync(join(root, 'assets/logos/docebo.svg'), dataUri('oC'))
console.log('wrote    logos/eleva.svg logos/docebo.svg')

const files = [...bundle.matchAll(/new URL\("([^"]+\.svg)"/g)].map((m) => m[1])
const besharp = files.find((f) => f.toLowerCase().includes('besharp'))
const overnet = files.find((f) => f.toLowerCase().includes('overnet'))
if (!besharp || !overnet) throw new Error(`sponsor files missing: ${files.join(', ')}`)
await save(`${site}/assets/${besharp}`, join(root, 'assets/logos/besharp.svg'))
await save(`${site}/assets/${overnet}`, join(root, 'assets/logos/overnet.svg'))

for (const [from, to] of Object.entries(DECK)) {
  const dest = join(root, 'assets', to)
  mkdir(dirname(dest))
  copyFileSync(join(deck, from), dest)
  console.log(`deck    ${to}`)
}

// Touch-read so a truncated download fails the script.
for (const name of ['eleva.svg', 'docebo.svg', 'besharp.svg', 'overnet.svg']) {
  const svg = readFileSync(join(root, 'assets/logos', name), 'utf8')
  if (!svg.includes('<svg')) throw new Error(`${name} is not svg`)
}
