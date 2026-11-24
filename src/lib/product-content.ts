import { formatProductos } from '@/lib/api'
import type { Product } from '@/types/api'

export interface ProductContentPhoto {
    id?: string
    url: string
    name?: string
    alt?: string
    orden?: number
}

export interface ProductContent {
    article_id: string
    slug: string
    published: boolean
    sort_order?: number
    featured?: boolean
    featured_order?: number
    name: string
    short_description?: string
    description?: string
    origin?: string
    badge?: string
    price: number | null
    club_price?: number | null
    previous_price?: number | null
    photos?: ProductContentPhoto[]
    presentation?: Array<Record<string, any>>
    certifications?: Array<Record<string, any> | string>
    related_products?: Array<{ id?: string } | string>
    sensory_profile?: Record<string, any>
    preparation?: Record<string, any>
    ingredients?: Array<Record<string, any> | string>
    benefits?: Array<Record<string, any> | string>
    differentials?: Array<Record<string, any>>
    seo_title?: string
    seo_description?: string
    previous_slugs?: string[]
    [key: string]: any
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function relatedContentIds(content: ProductContent): string[] {
    return (content.related_products ?? [])
        .map((item) => (typeof item === 'string' ? item : item?.id))
        .filter((id): id is string => Boolean(id))
}

function isFinitePrice(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function validateProductContents(
    records: Array<{ filename: string; content: ProductContent }>,
): string[] {
    const errors: string[] = []
    const ids = new Map<string, string>()
    const slugs = new Map<string, string>()
    const previousSlugs = new Map<string, string>()

    for (const { filename, content } of records) {
        const label = filename || content.article_id || '(sin archivo)'

        if (!content.article_id || typeof content.article_id !== 'string') {
            errors.push(`${label}: falta article_id.`)
            continue
        }
        if (filename && content.article_id !== filename) {
            errors.push(`${label}: el nombre del archivo no coincide con article_id.`)
        }
        if (ids.has(content.article_id)) {
            errors.push(`${label}: article_id duplicado (${content.article_id}).`)
        }
        ids.set(content.article_id, label)

        if (!content.slug || !SLUG_PATTERN.test(content.slug)) {
            errors.push(`${label}: slug inválido (${content.slug ?? ''}).`)
        } else if (slugs.has(content.slug)) {
            errors.push(`${label}: slug duplicado (${content.slug}).`)
        } else {
            slugs.set(content.slug, label)
        }

        if (!content.name || typeof content.name !== 'string') {
            errors.push(`${label}: falta name.`)
        }
        if (typeof content.published !== 'boolean') {
            errors.push(`${label}: published debe ser booleano.`)
        }
        if (content.featured !== undefined && typeof content.featured !== 'boolean') {
            errors.push(`${label}: featured debe ser booleano.`)
        }

        if (!isFinitePrice(content.price)) {
            errors.push(`${label}: price debe ser un número mayor o igual a 0.`)
        }
        if (
            content.club_price !== undefined &&
            content.club_price !== null &&
            !isFinitePrice(content.club_price)
        ) {
            errors.push(`${label}: club_price debe ser un número mayor o igual a 0.`)
        }
        if (
            isFinitePrice(content.price) &&
            isFinitePrice(content.club_price) &&
            content.club_price > content.price
        ) {
            errors.push(`${label}: club_price no puede ser mayor que price.`)
        }
        if (
            content.previous_price !== undefined &&
            content.previous_price !== null &&
            !isFinitePrice(content.previous_price)
        ) {
            errors.push(`${label}: previous_price debe ser un número mayor o igual a 0.`)
        }
        if (
            isFinitePrice(content.price) &&
            isFinitePrice(content.previous_price) &&
            content.previous_price < content.price
        ) {
            errors.push(`${label}: previous_price no puede ser menor que price.`)
        }

        for (const photo of content.photos ?? []) {
            if (!photo?.url || !/^https?:\/\//i.test(photo.url)) {
                errors.push(`${label}: hay una foto sin URL http(s) válida.`)
            }
        }

        for (const previous of content.previous_slugs ?? []) {
            if (!SLUG_PATTERN.test(previous)) {
                errors.push(`${label}: previous_slug inválido (${previous}).`)
            } else if (slugs.has(previous) || previousSlugs.has(previous)) {
                errors.push(`${label}: previous_slug duplicado (${previous}).`)
            } else {
                previousSlugs.set(previous, label)
            }
        }
    }

    for (const { content } of records) {
        for (const relatedId of relatedContentIds(content)) {
            if (!ids.has(relatedId)) {
                errors.push(`${content.article_id}: related_product inexistente (${relatedId}).`)
            }
        }
    }

    for (const [previous, label] of previousSlugs) {
        if (slugs.has(previous)) {
            errors.push(`${label}: previous_slug choca con un slug vigente (${previous}).`)
        }
    }

    return errors
}

export function mergeProductContent(erpProduct: Product, content: ProductContent): Product {
    return formatProductos([
        {
            ...erpProduct,
            ...content,
            id: erpProduct.id,
            article_id: String(erpProduct.id),
            slug: content.slug,
            photos: content.photos ?? [],
        },
    ])[0]
}
