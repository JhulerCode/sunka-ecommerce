import { describe, expect, it } from 'vitest'
import { mergeProductContent, validateProductContents } from '@/lib/product-content'
import {
    findProductContentBySlug,
    getAllProductContents,
    getProductContentById,
} from '@/lib/server/product-content'

describe('contenido local de productos', () => {
    const contents = getAllProductContents()

    it('valida todos los archivos migrados', () => {
        expect(contents.length).toBeGreaterThan(0)
        expect(
            validateProductContents(
                contents.map((content) => ({
                    filename: content.article_id,
                    content,
                })),
            ),
        ).toEqual([])
    })

    it('resuelve un producto por su slug', () => {
        const content = contents[0]
        const match = findProductContentBySlug(content.slug)

        expect(match?.content.article_id).toBe(content.article_id)
        expect(match?.previous).toBe(false)
    })

    it('detecta slugs anteriores duplicados', () => {
        const [first, second] = contents
        const errors = validateProductContents([
            {
                filename: first.article_id,
                content: { ...first, previous_slugs: ['slug-repetido'] },
            },
            {
                filename: second.article_id,
                content: { ...second, previous_slugs: ['slug-repetido'] },
            },
        ])

        expect(errors.some((error) => error.includes('previous_slug duplicado'))).toBe(true)
    })

    it('mezcla el contenido sobre los datos maestros del ERP', () => {
        const content = getProductContentById('2bbbced5-62e2-4d2d-89f8-aa6373ff3904')
        expect(content).toBeDefined()

        const product = mergeProductContent(
            {
                id: content!.article_id,
                name: 'NOMBRE ERP',
                unit: 'NIU',
                igv_afectacion: '10',
                line: { name: 'Tradicional' },
            } as any,
            content!,
        )

        expect(product.slug).toBe(content!.slug)
        expect(product.name).toBe(content!.name)
        expect(product.price).toBe(Number(content!.price).toFixed(2))
        expect(product.photo).toBe(content!.photos?.[0]?.url)
    })
})
