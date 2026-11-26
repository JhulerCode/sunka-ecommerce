const DEFAULT_SITE_URL = 'https://sunka.com.pe'

const metaEnv = (import.meta as { env?: Record<string, string | undefined> }).env

// Fuente única del dominio canónico. `SITE_URL` (Docker, CI o .env) lo sobreescribe;
// si no existe, se usa el dominio de producción de esta constante.
export const SITE_URL = (
    process.env.SITE_URL ||
    metaEnv?.SITE_URL ||
    DEFAULT_SITE_URL
).replace(/\/+$/, '')

export const siteUrl = new URL(SITE_URL)
