import { supabase } from '../supabase'

/** IDs de buckets en Supabase Storage (mismo nombre que en el panel; distinguen mayúsculas). */
export const STORAGE_BUCKET_PERFILES = 'Perfiles'
export const STORAGE_BUCKET_CLIENTES = 'Clientes'

/** Tipos MIME aceptados para fotos de perfil / clientes */
export const MIME_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']

/** Límite antes de comprimir (10 MB) */
export const TAMANO_MAX_ARCHIVO = 10 * 1024 * 1024

/**
 * @param {File} file
 * @returns {{ ok: true } | { ok: false, mensaje: string }}
 */
export function validarArchivoImagen(file) {
  if (!file || !(file instanceof File)) {
    return { ok: false, mensaje: 'Archivo no válido' }
  }
  if (file.size > TAMANO_MAX_ARCHIVO) {
    return { ok: false, mensaje: 'La imagen supera 10 MB' }
  }
  const type = (file.type || '').toLowerCase()
  const okMime = MIME_IMAGEN_PERMITIDOS.includes(type)
  const name = (file.name || '').toLowerCase()
  const okExt = /\.(jpe?g|png|webp)$/i.test(name)
  if (!okMime && !okExt) {
    return { ok: false, mensaje: 'Formato no permitido (usa JPG, PNG o WebP)' }
  }
  return { ok: true }
}

function slugNombreArchivo(nombre) {
  const s = String(nombre || 'foto')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .slice(0, 40)
  return s || 'foto'
}

/**
 * Comprimir imagen (JPEG) antes de subir. Si la imagen es más angosta que `maxWidth`, no escala hacia arriba.
 * @param {File} file
 * @param {number} [maxWidth=400]
 * @returns {Promise<File>}
 */
export async function comprimirImagen(file, maxWidth = 400) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      try {
        const w = img.naturalWidth || img.width
        const h = img.naturalHeight || img.height
        if (!w || !h) {
          resolve(file)
          return
        }
        const targetW = Math.min(maxWidth, w)
        const ratio = targetW / w
        canvas.width = targetW
        canvas.height = Math.round(h * ratio)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const base = file.name.replace(/\.[^.]+$/, '') || 'foto'
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            resolve(new File([blob], `${base}.jpg`, { type: 'image/jpeg' }))
          },
          'image/jpeg',
          0.7
        )
      } catch {
        resolve(file)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = objectUrl
  })
}

/**
 * Sube una foto al bucket indicado (comprime antes). Devuelve la URL pública o `null`.
 * @param {File} file
 * @param {string} bucket
 * @param {string} nombre prefijo legible para el path
 * @returns {Promise<string|null>}
 */
export async function subirFoto(file, bucket, nombre) {
  console.log('1. Archivo recibido:', file?.name, file?.size, file?.type)

  if (!supabase) {
    console.error('subirFoto: sin cliente Supabase (revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)')
    return null
  }

  let comprimida
  try {
    comprimida = await comprimirImagen(file)
    console.log('2. Comprimida:', comprimida?.name, comprimida?.size, comprimida?.type)
  } catch (e) {
    console.error('2. Error al comprimir:', e)
    return null
  }

  const ext = 'jpg'
  const path = `${slugNombreArchivo(nombre)}-${Date.now()}.${ext}`
  console.log('3. Subiendo a bucket:', bucket, 'path:', path)

  const { data, error } = await supabase.storage.from(bucket).upload(path, comprimida, {
    upsert: true,
    contentType: 'image/jpeg',
  })

  console.log('4. Resultado upload:', { data, error })

  if (error) {
    console.error('Error detallado:', error.message, {
      name: error.name,
      statusCode: error.statusCode,
      error: error.error,
      cause: error.cause,
    })
    return null
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  const publicUrl = urlData?.publicUrl ?? null
  console.log('5. URL pública:', publicUrl)

  return publicUrl
}
