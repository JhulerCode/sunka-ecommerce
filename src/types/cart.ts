export interface CartItem extends Record<string, any> {
    articulo: string | number
    cantidad: number
    pu: number
}
