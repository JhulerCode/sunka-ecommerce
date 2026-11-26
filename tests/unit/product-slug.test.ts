import { describe, expect, it } from 'vitest'
import { productSlug, slugifyProductName } from '@/lib/catalog/product-slug'

describe('slug de productos', () => {
    it('genera un slug legible a partir del nombre', () => {
        expect(slugifyProductName('Té Verde · 20 sobres')).toBe('te-verde-20-sobres')
        expect(slugifyProductName('Jamaica y Piña')).toBe('jamaica-y-pina')
        expect(slugifyProductName('  Passion Tea  Luxury  ')).toBe('passion-tea-luxury')
        expect(slugifyProductName('Manzanilla 20’ sobres')).toBe('manzanilla-20-sobres')
    })

    it('usa el id cuando el nombre no produce un slug', () => {
        expect(productSlug({ id: 'tea-1', name: '+++' })).toBe('tea-1')
        expect(productSlug({ id: 'tea-1', name: 'Té Andino' })).toBe('te-andino')
    })
})
