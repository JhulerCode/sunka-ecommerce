const DIACRITICS = /[\u0300-\u036f]/g

export function slugifyProductName(name: unknown): string {
    return String(name ?? '')
        .normalize('NFD')
        .replace(DIACRITICS, '')
        .toLowerCase()
        .replace(/['’"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

export function productSlug(product: { id?: string | number; name?: string }): string {
    return slugifyProductName(product.name) || String(product.id ?? '')
}
