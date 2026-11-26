export function getProductPrice(product: Record<string, any> | null | undefined, isAuthenticated = false) {
    if (!product) return null

    const clubPrice = product.club_price
    if (isAuthenticated && clubPrice !== undefined && clubPrice !== null && clubPrice !== '') {
        return clubPrice
    }

    return product.price
}

export function hasClubPrice(product: Record<string, any> | null | undefined) {
    if (!product) return false

    const regular = Number(product.price)
    const club = Number(product.club_price)
    return (
        product.club_price !== undefined &&
        product.club_price !== null &&
        product.club_price !== '' &&
        Number.isFinite(regular) &&
        Number.isFinite(club) &&
        regular !== club
    )
}
