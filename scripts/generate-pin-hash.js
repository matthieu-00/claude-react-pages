import { createHash } from 'crypto'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get PIN from command line arguments
const pin = process.argv[2]

if (!pin) {
  console.error('Usage: node scripts/generate-pin-hash.js <PIN>')
  console.error('Example: node scripts/generate-pin-hash.js "FQnSq30FCcFg1fiQ"')
  process.exit(1)
}

// Generate SHA-256 hash
const hash = createHash('sha256').update(pin).digest('hex')

console.log('PIN:', pin)
console.log('SHA-256 Hash:', hash)
console.log('\nCopy the hash above into src/lib/pinConfig.ts')
