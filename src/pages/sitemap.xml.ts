import type { APIRoute } from 'astro'
import { lineas } from '@/data/content/lineas'
import { rituals } from '@/data/content/ritual-articles'
import { getPublishedProductContents } from '@/lib/server/catalog/content'
import { getStoreProducts } from '@/lib/server/catalog/service'

const DEFAULT_SITE = 'https://www.sunka.pe'
const CACHE_TTL_MS = 60 * 60 * 1000
const STATIC_PATHS = [
    '/',
    '/tienda',
    '/origen',
    '/rituales',
    '/inspiracion',
    '/club',
    '/crea-tu-blend',
    '/promociones',
    '/faq',
    '/libro-de-reclamaciones',
    '/politica-de-privacidad',
    '/politica-de-despacho',
    '/terminos-y-condiciones',
]

let cache: { expiresAt: number; xml: string } | null = null

const escapeXml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')

async function getProductSlugs(): Promise<string[]> {
    try {
        const products = await getStoreProducts()
        const slugs = products.map((product) => String(product.slug ?? '')).filter(Boolean)
        if (slugs.length) return slugs
    } catch {
        // El sitemap no debe caerse si el ERP no responde.
    }

    return getPublishedProductContents().map((content) => content.slug)
}

async function buildSitemap(siteUrl: URL): Promise<string> {
    const paths = new Set<string>(STATIC_PATHS)

    for (const linea of lineas) paths.add(`/lineas/${linea.slug}`)
    for (const ritual of rituals) paths.add(`/ritual/${ritual.slug}`)
    for (const slug of await getProductSlugs()) paths.add(`/productos/${slug}`)

    const entries = [...paths].map(
        (path) => `    <url><loc>${escapeXml(new URL(path, siteUrl).href)}</loc></url>`,
    )

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...entries,
        '</urlset>',
        '',
    ].join('\n')
}

export const GET: APIRoute = async ({ site }) => {
    const siteUrl = site ?? new URL(DEFAULT_SITE)
    const now = Date.now()

    if (!cache || cache.expiresAt <= now) {
        cache = { expiresAt: now + CACHE_TTL_MS, xml: await buildSitemap(siteUrl) }
    }

    return new Response(cache.xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    })
}
