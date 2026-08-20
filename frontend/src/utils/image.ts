// ─── image.ts : client-side image helpers ─────────────────────────────────
// Avatar uploads go to the backend as base64 data URLs, which the API caps at
// 30 000 characters. A raw phone photo is ~2–8 MB (≈3–11 MB of base64), far
// over the cap, so the avatar is resized + recompressed in the browser before
// it is ever sent. This keeps saves fast and error-free.

const DEFAULT_MAX_DIM = 256 // avatar preview + cookie/session display size
const DEFAULT_MAX_CHARS = 15_000 // safely under the backend's 30 000 cap

/** Read a File as a data URL (base64). */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read the image file.'))
    reader.readAsDataURL(file)
  })
}

/** Decode a data URL into an HTMLImageElement. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('That file is not a valid image.'))
    img.src = src
  })
}

/**
 * Resize + compress an image file into a small base64 data URL.
 *
 * Keeps the aspect ratio, scales the longest edge to `maxDim`, draws the
 * result onto a white-backed canvas (so transparent PNGs don't turn black
 * when exported as JPEG), and picks the smallest JPEG quality that stays
 * under `maxChars`. Throws with a readable message when the file can't be
 * processed or compressed far enough.
 */
export async function resizeImage(
  file: File,
  maxDim = DEFAULT_MAX_DIM,
  maxChars = DEFAULT_MAX_CHARS
): Promise<string> {
  const source = await loadImage(await readFileAsDataUrl(file))

  const scale = Math.min(1, maxDim / Math.max(source.width, source.height))
  const width = Math.max(1, Math.round(source.width * scale))
  const height = Math.max(1, Math.round(source.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Your browser does not support image editing.')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0, width, height)

  // Try progressively stronger compression until the data URL fits.
  for (const quality of [0.85, 0.65, 0.45, 0.3]) {
    const out = canvas.toDataURL('image/jpeg', quality)
    if (out.length <= maxChars) return out
  }
  throw new Error('Image is too large to save — please pick a smaller picture.')
}

/** Validate an avatar file before it reaches the resize step. */
export function validateAvatarFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Please choose an image file.'
  if (file.size > 2 * 1024 * 1024) return 'Image is too large — pick one under 2 MB.'
  return null
}