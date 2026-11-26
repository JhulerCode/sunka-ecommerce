import { formatNumber } from './number'

export function formatProductPrice(value: unknown) {
    if (value === undefined || value === null || value === '') return ''
    const number = Number(value)
    return Number.isFinite(number) ? String(formatNumber(number, 2, false)) : String(value)
}

export function formatPrice(value: unknown, symbol = 'S/') {
    const amount = formatProductPrice(value)
    return amount ? `${String(symbol).trim()} ${amount}` : ''
}
