import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = join(__dirname, '../public/og.svg')
const pngPath = join(__dirname, '../public/og.png')

const svgBuf = readFileSync(svgPath)

try {
  const sharp = (await import('sharp')).default
  await sharp(svgBuf, { density: 150 }).resize(1200, 630).png().toFile(pngPath)
  console.log('✓ public/og.png generated (1200×630)')
} catch (e) {
  console.error('sharp not available:', e.message)
  console.log('Fallback: copying og.svg — install sharp to generate PNG')
  writeFileSync(pngPath.replace('.png', '-fallback.svg'), svgBuf)
}
