import { productSlug } from '@/lib/product-slug'
import type { Product } from '@/types/api'

export function formatProductos(datos: Array<Record<string, any>> = []): Product[] {
    return datos.map((source): Product => {
        const producto: Record<string, any> = {
            ...source,
            unidad: source.unit,
            linea: source.line_id,
            linea1: source.line,
            igv_afectacion: source.igv_affectation,
            photos: Array.isArray(source.photos) ? source.photos : [],
        }

        return {
            ...producto,
            id: producto.id,
            name: producto.name,
            price:
                producto.price == null || producto.price === ''
                    ? producto.price
                    : Number(producto.price).toFixed(2),
            club_price:
                producto.club_price == null || producto.club_price === ''
                    ? producto.club_price
                    : Number(producto.club_price).toFixed(2),
            previous_price:
                producto.previous_price == null || producto.previous_price === ''
                    ? null
                    : Number(producto.previous_price).toFixed(2),
            photo: producto.photos[0]?.url,
            slug: String(producto.slug ?? productSlug({ id: producto.id, name: producto.name })),
            article_id: String(producto.article_id ?? producto.id),
        } as Product
    })
}
