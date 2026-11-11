/**
 * Confere as imagens de demonstração desta pasta contra `LISTA-DE-ARQUIVOS.md`: o que falta, o que passa de 200 KB, o que
 * não é WebP e o que está sem crédito em `CREDITS.md`. Uso: `bun scripts/seed-assets/verificar.ts`. Sai com código 1 se
 * houver algum problema, para servir de trava antes do apêndice do TCC.
 */

const MAX_BYTES = 200 * 1024
const folder = new URL('./', import.meta.url)

const list = await Bun.file(new URL('LISTA-DE-ARQUIVOS.md', folder)).text()
const expected = [...list.matchAll(/^\| `([a-z0-9/-]+\.webp)`/gm)].map((match) => match[1]!)

const credits = await Bun.file(new URL('CREDITS.md', folder)).text()
const credited = new Set(
  credits
    .split('\n')
    .map((line) => line.split('|').map((cell) => cell.trim()))
    // ['', arquivo, autor, url, licença, data, '']
    .filter((cells) => cells.length >= 7 && /^`.*\.webp`$/.test(cells[1]!) && cells.slice(2, 6).every(Boolean))
    .map((cells) => cells[1]!.replaceAll('`', '')),
)

const problems: string[] = []
let present = 0

for (const name of expected) {
  const file = Bun.file(new URL(name, folder))
  if (!(await file.exists())) {
    problems.push(`falta     ${name}`)
    continue
  }
  present++
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const isWebp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  if (!isWebp) problems.push(`não é WebP ${name}`)
  if (file.size > MAX_BYTES) problems.push(`grande    ${name} (${Math.ceil(file.size / 1024)} KB, máximo 200 KB)`)
  if (!credited.has(name)) problems.push(`sem crédito ${name}`)
}

console.log(`${present} de ${expected.length} imagens na pasta.`)
for (const problem of problems) console.log(`  ${problem}`)
process.exit(problems.length > 0 ? 1 : 0)