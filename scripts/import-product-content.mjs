import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { slugifyProductName } from '../src/lib/product-slug.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = join(root, 'src/data/products')
const base = (process.env.API_URL || '').replace(/\/$/, '')

if (!base) {
    console.error('API_URL no está configurada.')
    process.exit(1)
}

if (
    existsSync(outputDir) &&
    readdirSync(outputDir).length > 0 &&
    !process.argv.includes('--force')
) {
    console.error(
        'Ya existen archivos de contenido en src/data/products. Este script los reemplaza: usa --force para continuar.',
    )
    process.exit(1)
}

const response = await fetch(`${base}/api/v1/productos`, {
    headers: {
        accept: 'application/json',
        'x-api-key': process.env.ERP_API_KEY || '',
    },
})

if (!response.ok) {
    console.error(`No se pudo leer el catálogo: HTTP ${response.status}`)
    console.error(await response.text())
    process.exit(1)
}

const payload = await response.json()
const products = Array.isArray(payload.data) ? payload.data : []
if (!products.length) {
    console.error('El ERP no devolvió productos para migrar.')
    process.exit(1)
}

rmSync(outputDir, { recursive: true, force: true })
mkdirSync(outputDir, { recursive: true })

const slugs = new Map()
const records = []

for (const [index, product] of products.entries()) {
    const ecommerce = product.ecommerce_data || {}
    const name = ecommerce.name || product.name
    const slug = slugifyProductName(name) || product.id

    if (slugs.has(slug)) {
        console.error(`Slug duplicado "${slug}": ${slugs.get(slug)} y ${product.id}`)
        process.exit(1)
    }
    slugs.set(slug, product.id)

    const content = {
        article_id: product.id,
        slug,
        published: true,
        sort_order: index + 1,
        featured: Boolean(ecommerce.is_featured),
        featured_order: 0,
        ...ecommerce,
        name,
        price: ecommerce.price ?? null,
        club_price: ecommerce.club_price ?? null,
        previous_price: ecommerce.previous_price ?? null,
        photos: Array.isArray(ecommerce.photos) ? ecommerce.photos : [],
        presentation: Array.isArray(ecommerce.presentation) ? ecommerce.presentation : [],
        certifications: Array.isArray(ecommerce.certifications) ? ecommerce.certifications : [],
        related_products: Array.isArray(ecommerce.related_products)
            ? ecommerce.related_products.filter((item) => item?.id)
            : [],
        sensory_profile:
            ecommerce.sensory_profile && typeof ecommerce.sensory_profile === 'object'
                ? ecommerce.sensory_profile
                : {},
        preparation:
            ecommerce.preparation && typeof ecommerce.preparation === 'object'
                ? ecommerce.preparation
                : {},
        seo_title: '',
        seo_description: '',
        previous_slugs: [],
    }

    delete content.is_featured

    records.push(content)
}

const featured = records.filter((record) => record.featured)
featured.forEach((record, index) => {
    record.featured_order = index + 1
})

for (const record of records) {
    writeFileSync(
        join(outputDir, `${record.article_id}.json`),
        `${JSON.stringify(record, null, 4)}\n`,
        'utf8',
    )
}

const relatedIds = new Set(records.flatMap((record) => record.related_products.map((item) => item.id)))
const knownIds = new Set(records.map((record) => record.article_id))
const missingRelated = [...relatedIds].filter((id) => !knownIds.has(id))

console.log(`Migrados ${records.length} productos a ${outputDir}`)
console.log(`Destacados: ${featured.length}`)
if (missingRelated.length) {
    console.warn(`Relacionados fuera del catálogo (${missingRelated.length}): ${missingRelated.join(', ')}`)
}
