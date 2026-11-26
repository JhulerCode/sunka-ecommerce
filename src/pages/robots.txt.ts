import type { APIRoute } from 'astro'
import { siteUrl as defaultSiteUrl } from '@/config/site'

export const GET: APIRoute = ({ site }) => {
    const siteUrl = site ?? defaultSiteUrl
    const lines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        'Disallow: /account',
        'Disallow: /checkout',
        'Disallow: /consulta-pedido',
        'Disallow: /pedidos/',
        'Disallow: /arco',
        '',
        `Sitemap: ${new URL('sitemap.xml', siteUrl).href}`,
        '',
    ]

    return new Response(lines.join('\n'), {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    })
}
