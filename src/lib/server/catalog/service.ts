import { formatProductos } from '@/lib/catalog/product-format'
import { mergeProductContent } from '@/lib/catalog/product-content'
import type { Product } from '@/types/api'
import type { ProductContent } from '@/types/product'
import { serverGet } from '../public-api'
import {
    findProductContentBySlug,
    getFeaturedProductContents,
    getProductContentsByIds,
    getPublishedProductContents,
} from './content'

const CHUNK_SIZE = 50

function chunks<T>(items: T[], size: number): T[][] {
    const result: T[][] = []
    for (let index = 0; index < items.length; index += size) {
        result.push(items.slice(index, index + size))
    }
    return result
}

async function fetchErpProducts(
    ids: string[],
    { strict = false }: { strict?: boolean } = {},
): Promise<Product[]> {
    const unique = [...new Set(ids.map(String).filter(Boolean))]
    if (!unique.length) return []

    const products: Product[] = []
    for (const chunk of chunks(unique, CHUNK_SIZE)) {
        const result = await serverGet('productos', { ids: chunk })
        if (!result.ok) {
            if (strict) throw new Error('ERP_UNAVAILABLE')
            continue
        }
        products.push(...formatProductos(result.data ?? []))
    }
    return products
}

function mergeAll(erpProducts: Product[], contents: ProductContent[]): Product[] {
    const byId = new Map(erpProducts.map((product) => [String(product.id), product]))

    return contents
        .map((content) => {
            const erpProduct = byId.get(content.article_id)
            return erpProduct ? mergeProductContent(erpProduct, content) : null
        })
        .filter((product): product is Product => Boolean(product))
}

export async function getStoreProducts(ids?: string[]): Promise<Product[]> {
    const contents = ids
        ? getProductContentsByIds(ids).filter((content) => content.published)
        : getPublishedProductContents()

    const erpProducts = await fetchErpProducts(contents.map((content) => content.article_id))
    return mergeAll(erpProducts, contents)
}

export async function getFeaturedStoreProducts(): Promise<Product[]> {
    const contents = getFeaturedProductContents()
    const erpProducts = await fetchErpProducts(contents.map((content) => content.article_id))
    return mergeAll(erpProducts, contents)
}

export async function getStoreProductBySlug(
    slug: string,
): Promise<{ product: Product; previous: boolean } | undefined> {
    const match = findProductContentBySlug(slug)
    if (!match || !match.content.published) return undefined

    const [product] = await getStoreProducts([match.content.article_id])
    if (!product) return undefined

    return { product, previous: match.previous }
}

export interface CheckoutProductData {
    product: Product
    content: ProductContent
}

export async function getCheckoutProducts(
    ids: string[],
): Promise<Map<string, CheckoutProductData>> {
    const contents = getProductContentsByIds(ids).filter((content) => content.published)
    const erpProducts = await fetchErpProducts(
        contents.map((content) => content.article_id),
        { strict: true },
    )
    const byId = new Map(erpProducts.map((product) => [String(product.id), product]))
    const result = new Map<string, CheckoutProductData>()

    for (const content of contents) {
        const product = byId.get(content.article_id)
        if (product) result.set(content.article_id, { product, content })
    }

    return result
}
