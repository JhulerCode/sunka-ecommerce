export function formatProductPrice(value: unknown) {
    if (value === undefined || value === null || value === '') return ''
    const number = Number(value)
    return Number.isFinite(number) ? number.toFixed(2) : String(value)
}

export function formatPrice(value: unknown, symbol = 'S/') {
    const amount = formatProductPrice(value)
    return amount ? `${String(symbol).trim()} ${amount}` : ''
}
