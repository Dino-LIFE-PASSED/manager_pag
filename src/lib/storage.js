const BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${import.meta.env.VITE_SUPABASE_BUCKET}`

export function getImageUrl(path) {
  if (!path) return null
  return `${BASE}/${path}`
}
