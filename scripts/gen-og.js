import { readFileSync } from 'fs'
import sharp from 'sharp'

const svg = readFileSync('./public/og.svg')
await sharp(svg).png().toFile('./public/og.png')
console.log('og.png generated (1200x630)')
