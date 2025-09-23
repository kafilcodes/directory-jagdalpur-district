export function getThumbnailUrl(originalUrl: string, size = 400) {
  try {
    // Works with Firebase Extensions Resize Images default naming: filePath_400x400.jpg
    // Only supports storage.googleapis.com URLs.
    const url = new URL(originalUrl)
    if (!/storage\.googleapis\.com$/.test(url.hostname)) return originalUrl
    const parts = url.pathname.split("/")
    const filename = parts.pop()!
    const [name, ext] = filename.split(".")
    const thumb = `${name}_${size}x${size}.${ext || "jpg"}`
    parts.push(thumb)
    url.pathname = parts.join("/")
    return url.toString()
  } catch {
    return originalUrl
  }
}
