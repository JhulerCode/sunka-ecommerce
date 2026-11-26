import { describe, expect, it } from 'vitest'
import { formatPrice, formatProductPrice } from '@/lib/utils/currency'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import { formatNumber } from '@/lib/utils/number'

describe('utilidades de formato', () => {
    it('formatea montos con dos decimales', () => {
        expect(formatProductPrice(12)).toBe('12.00')
        expect(formatProductPrice('12.5')).toBe('12.50')
        expect(formatProductPrice(null)).toBe('')
        expect(formatProductPrice('no-numero')).toBe('no-numero')
    })

    it('formatea precios con símbolo', () => {
        expect(formatPrice(12)).toBe('S/ 12.00')
        expect(formatPrice('12.5', 'S/ ')).toBe('S/ 12.50')
        expect(formatPrice(null)).toBe('')
    })

    it('formatea números con separador de miles', () => {
        expect(formatNumber(1234.5)).toBe('1,234.50')
        expect(formatNumber(null)).toBeNull()
    })

    it('formatea fechas en formato peruano', () => {
        expect(formatDate('2026-08-29')).toBe('29/08/2026')
        expect(formatDate('2026-08-29T12:00:00.000Z')).toMatch(/^\d{2}\/\d{2}\/2026$/)
        expect(formatDate(null)).toBeNull()
        expect(formatDateTime('2026-08-29T12:00:00.000Z')).toMatch(/\d{2}\/\d{2}\/\d{2}/)
    })
})
