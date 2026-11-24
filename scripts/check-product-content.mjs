import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = join(root, 'src/data/products')
const base = (process.env.API_URL || '').replace(/\/$/, '')
const CHUNK_SIZE = 50

function chunks(items, size) {
    const result = []
    for (let index = 0; index < items.length; index += size) {
        result.push(items.slice(index, index + size))
    }
    return result
}

async function fetchProducts(ids) {
    const params = ids?.length ? `?ids=${ids.map(encodeURIComponent).join(',')}` : ''
    const response = await fetch(`${base}/api/v1/productos${params}`, {
        headers: {
            accept: 'application/json',
            'x-api-key': process.env.ERP_API_KEY || '',
        },
    })

    if (!response.ok) {
        throw new Error(`No se pudo leer el catálogo: HTTP ${response.status}\n${await response.text()}`)
    }

    const payload = await response.json()
    return Array.isArray(payload.data) ? payload.data : []
}

async function main() {
    if (!base) {
        console.error('API_URL no está configurada.')
        process.exitCode = 1
        return
    }

    const contents = readdirSync(contentDir)
        .filter((name) => name.endsWith('.json'))
        .map((name) => JSON.parse(readFileSync(join(contentDir, name), 'utf8')))

    const contentIds = contents.map((content) => String(content.article_id))
    const erpProducts = []

    for (const chunk of chunks(contentIds, CHUNK_SIZE)) {
        erpProducts.push(...(await fetchProducts(chunk)))
    }

    const erpIds = new Set(erpProducts.map((product) => String(product.id)))
    const missingInErp = contentIds.filter((id) => !erpIds.has(id))

    console.log(`Contenido local: ${contentIds.length}`)
    console.log(`Productos devueltos por el ERP para esos IDs: ${erpIds.size}`)

    if (missingInErp.length) {
        console.error(`Contenido publicado que el ERP no devuelve: ${missingInErp.length}`)
        console.error(missingInErp.join(', '))
        process.exitCode = 1
        return
    }

    console.log('Todos los productos con contenido existen y son vendibles en el ERP.')
}

main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
})
