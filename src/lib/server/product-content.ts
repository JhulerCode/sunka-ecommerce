import {
    validateProductContents,
    type ProductContent,
} from '@/lib/product-content'

const modules = import.meta.glob<ProductContent>('../../data/products/*.json', {
    eager: true,
    import: 'default',
})

const records = Object.entries(modules).map(([path, content]) => ({
    filename: path.split('/').pop()?.replace(/\.json$/, '') ?? '',
    content,
}))

const validationErrors = validateProductContents(records)
if (validationErrors.length) {
    throw new Error(`Contenido de productos inválido:\n${validationErrors.join('\n')}`)
}

const contents = records.map((record) => record.content)

const byId = new Map(contents.map((content) => [content.article_id, content]))
const bySlug = new Map(contents.map((content) => [content.slug, content]))
const byPreviousSlug = new Map<string, ProductContent>()
for (const content of contents) {
    for (const slug of content.previous_slugs ?? []) {
        byPreviousSlug.set(slug, content)
    }
}

const bySortOrder = [...contents].sort(
    (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        a.name.localeCompare(b.name, 'es'),
)

const featured = bySortOrder
    .filter((content) => content.published && content.featured)
    .sort(
        (a, b) =>
            (a.featured_order ?? 0) - (b.featured_order ?? 0) ||
            a.name.localeCompare(b.name, 'es'),
    )

export function getAllProductContents(): ProductContent[] {
    return bySortOrder
}

export function getPublishedProductContents(): ProductContent[] {
    return bySortOrder.filter((content) => content.published)
}

export function getFeaturedProductContents(): ProductContent[] {
    return featured
}

export function getProductContentById(articleId: string): ProductContent | undefined {
    return byId.get(articleId)
}

export function findProductContentBySlug(
    slug: string,
): { content: ProductContent; previous: boolean } | undefined {
    const content = bySlug.get(slug)
    if (content) return { content, previous: false }

    const previous = byPreviousSlug.get(slug)
    if (previous) return { content: previous, previous: true }

    return undefined
}

export function getProductContentsByIds(ids: string[]): ProductContent[] {
    return ids
        .map((id) => byId.get(String(id)))
        .filter((content): content is ProductContent => Boolean(content))
}
