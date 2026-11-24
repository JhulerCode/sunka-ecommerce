import type { APIRoute } from 'astro'
import { json } from '@/lib/server/bff'
import { getStoreProducts } from '@/lib/server/product-catalog'

export const GET: APIRoute = async ({ request }) => {
    const source = new URL(request.url).searchParams
    const ids = (source.get('ids') || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)

    const products = await getStoreProducts(ids.length ? ids : undefined)
    const response = json({ ok: true, status: 200, data: products })
    response.headers.set('cache-control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
}
