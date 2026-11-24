import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    ORDER_CURRENCY,
    PARTNER_ORDER_ORIGIN,
    PARTNER_ORDER_TYPE,
    createPaymentSchema,
    partnerOrderTypeSchema,
} from '../../src/lib/api-schemas'
import { buildCheckoutDraft, prepareCheckoutOrder } from '../../src/lib/server/checkout-order'
import type { CheckoutProductData } from '../../src/lib/server/product-catalog'
import { getMinimumDeliveryDate } from '../../src/lib/delivery-date'

vi.mock('../../src/lib/server/product-catalog', () => ({
    getCheckoutProducts: vi.fn(async (ids: string[]) =>
        new Map(
            ids.map((id) => [
                id,
                {
                    product: {
                        id,
                        name: id,
                        unit: 'UND',
                        igv_afectacion: '10',
                        line: { name: 'Tradicional' },
                    },
                    content: {
                        article_id: id,
                        slug: id,
                        published: true,
                        name: id,
                        price: 20,
                        club_price: null,
                        presentation: [{ label: 'Saquitos', value: 50 }],
                    },
                },
            ]),
        ),
    ),
}))

function productData(
    articleId: string,
    price: number,
    lineName = 'Tradicional',
    presentation = 50,
): CheckoutProductData {
    return {
        product: {
            id: articleId,
            name: articleId,
            unit: 'UND',
            igv_afectacion: '10',
            line: { name: lineName },
        } as any,
        content: {
            article_id: articleId,
            slug: articleId,
            published: true,
            name: articleId,
            price,
            club_price: null,
            presentation: [{ label: 'Saquitos', value: presentation }],
        },
    }
}

function products(...items: CheckoutProductData[]) {
    return new Map(items.map((item) => [item.content.article_id, item]))
}

const defaultProducts = products(productData('product-1', 20), productData('product-2', 20))

function draft(overrides: Record<string, unknown> = {}) {
    return {
        type: 'sale',
        delivery_type: 'retiro',
        punto_retiro: 'planta-sunka',
        delivery_date: '2026-08-30',
        partner_order_lines: [
            {
                article_id: 'product-1',
                quantity: 1,
                unit_price: 20,
                igv_afectacion: '10',
                igv_porcentaje: 18,
                line_name: 'Tradicional',
                presentation: [{ label: 'Saquitos', value: 50 }],
            },
        ],
        ...overrides,
    }
}

const context = { now: new Date('2026-08-28T19:00:00.000Z'), products: defaultProducts }

describe('contrato partnerOrder.type con integration', () => {
    it('define sale como único tipo válido del checkout', () => {
        expect(PARTNER_ORDER_TYPE).toBe('sale')
        expect(partnerOrderTypeSchema.safeParse('sale').success).toBe(true)
        expect(partnerOrderTypeSchema.safeParse(2).success).toBe(false)
        expect(partnerOrderTypeSchema.safeParse('purchase').success).toBe(false)
    })

    it('normaliza type y origin hacia el contrato del ERP', () => {
        const order = buildCheckoutDraft(draft(), context)
        expect(order.type).toBe('sale')
        expect(order.origin).toBe('integration')
        expect(order.currency_id).toBe('PEN')
        expect(order.payment_method).toBe('tarjeta')
    })

    it('genera el número de pedido en el BFF y descarta el del navegador', () => {
        const order = buildCheckoutDraft(draft({ code: 'PEDIDO-MANIPULADO' }), context)
        expect(order.code).toMatch(/^[0-9]{12}$/)
        expect(order.code.startsWith('260828')).toBe(true)
    })

    it('rechaza el type legacy numérico', () => {
        expect(() => buildCheckoutDraft(draft({ type: 2 }), context)).toThrow(
            'INVALID_ORDER_TYPE',
        )
    })

    it('rechaza origin, moneda, medio de pago y comprobante fuera de contrato', () => {
        expect(() =>
            buildCheckoutDraft(draft({ origin: 'ecommerce' }), context),
        ).toThrow('INVALID_ORDER_ORIGIN')
        expect(() =>
            buildCheckoutDraft(draft({ currency_id: 'USD' }), context),
        ).toThrow('INVALID_ORDER_CURRENCY')
        expect(() =>
            buildCheckoutDraft(draft({ payment_method: 'efectivo' }), context),
        ).toThrow('INVALID_PAYMENT_METHOD')
        expect(() =>
            buildCheckoutDraft(draft({ invoice_type: '99' }), context),
        ).toThrow('INVALID_INVOICE_TYPE')
    })

    it('los schemas del BFF rechazan literales fuera de contrato', () => {
        expect(PARTNER_ORDER_ORIGIN).toBe('integration')
        expect(ORDER_CURRENCY).toBe('PEN')
        expect(
            createPaymentSchema.safeParse({
                email: 'a@b.pe',
                partner_order: { type: 2 },
            }).success,
        ).toBe(false)
        expect(
            createPaymentSchema.safeParse({
                email: 'a@b.pe',
                partner_order: { type: 'sale', payment_method: 'yape', invoice_type: '03' },
            }).success,
        ).toBe(false)
        expect(
            createPaymentSchema.safeParse({
                email: 'a@b.pe',
                partner_order: { type: 'sale', payment_method: 'tarjeta', invoice_type: '03' },
            }).success,
        ).toBe(true)
        expect(
            createPaymentSchema.safeParse({
                email: 'a@b.pe',
                partner_order: { type: 'purchase' },
            }).success,
        ).toBe(false)
    })
})

describe('preparación del pedido del checkout', () => {
    it('envía al ERP el precio neto y conserva el total mostrado', () => {
        const order = buildCheckoutDraft(
            draft({
                partner_order_lines: [
                    {
                        article_id: 'product-1',
                        quantity: 1,
                        unit_price: 20,
                        igv_afectacion: '10',
                        igv_porcentaje: 18,
                    },
                ],
            }),
            context,
        )
        expect(order.partner_order_lines[0].unit_price).toBeCloseTo(20 / 1.18, 10)
        expect(order.amount).toBe(20)
        expect(order.delivery_cost).toBe(0)
    })

    it('calcula el precio desde el contenido si el navegador no lo envía', () => {
        const order = buildCheckoutDraft(
            draft({
                partner_order_lines: [
                    {
                        article_id: 'product-1',
                        quantity: 1,
                    },
                ],
            }),
            context,
        )
        expect(order.amount).toBe(20)
        expect(order.partner_order_lines[0].unit_price).toBeCloseTo(20 / 1.18, 10)
    })

    it('rechaza un precio manipulado por el navegador', () => {
        expect(() =>
            buildCheckoutDraft(
                draft({
                    partner_order_lines: [
                        {
                            article_id: 'product-1',
                            quantity: 1,
                            unit_price: 0.01,
                        },
                    ],
                }),
                context,
            ),
        ).toThrow('PRICE_CHANGED')
    })

    it('exige líneas con artículo, cantidad y precio válidos', () => {
        for (const partner_order_lines of [
            [],
            [{ article_id: '', quantity: 1, unit_price: 20 }],
            [{ article_id: 'product-1', quantity: 0, unit_price: 20 }],
            [{ article_id: 'product-1', quantity: 101, unit_price: 20 }],
            [{ article_id: 'product-1', quantity: 1, unit_price: -1 }],
        ]) {
            expect(() => buildCheckoutDraft(draft({ partner_order_lines }), context)).toThrow(
                'INVALID_CART',
            )
        }
    })

    it('calcula envío y promociones con los precios vistos', () => {
        const order = buildCheckoutDraft(
            draft({
                delivery_type: 'envio',
                delivery_ubigeo_id: '150101',
                delivery_address_data: { ubigeo1: { province: 'Lima' } },
                partner_order_lines: [
                    {
                        article_id: 'product-1',
                        quantity: 3,
                        unit_price: 25,
                        line_name: 'Tradicional',
                        presentation: [{ label: 'Saquitos', value: 50 }],
                    },
                    {
                        article_id: 'product-2',
                        quantity: 2,
                        unit_price: 25,
                        line_name: 'Tradicional',
                        presentation: [{ label: 'Saquitos', value: 20 }],
                    },
                ],
            }),
            {
                ...context,
                products: products(
                    productData('product-1', 25, 'Tradicional', 50),
                    productData('product-2', 25, 'Tradicional', 20),
                ),
            },
        )
        expect(order.delivery_cost).toBe(0)
        expect(order.promotions[0].key).toBe('tradicional-general')
    })

    it('atribuye el pedido de invitado al socio del servidor y descarta el del navegador', () => {
        const order = buildCheckoutDraft(
            draft({ partner_id: 'partner-manipulado' }),
            { ...context, guestPartnerId: 'partner-invitado' },
        )
        expect(order.partner_id).toBe('partner-invitado')

        const member = buildCheckoutDraft(
            draft({ partner_id: 'partner-manipulado' }),
            { ...context, isClubMember: true },
        )
        expect(member.partner_id).toBeUndefined()
    })

    it('el servidor rechaza una fecha anterior a la permitida', () => {
        expect(() =>
            buildCheckoutDraft(
                draft({ delivery_date: '2026-08-29' }),
                { now: new Date('2026-08-28T21:00:00.000Z') },
            ),
        ).toThrow('INVALID_DELIVERY_DATE')
    })

    it('el servidor rechaza un envío fuera de la cobertura de la tienda', () => {
        expect(() =>
            buildCheckoutDraft(
                draft({
                    delivery_type: 'envio',
                    delivery_ubigeo_id: '080101',
                    delivery_address_data: { ubigeo1: { province: 'Cusco' } },
                }),
                context,
            ),
        ).toThrow('DELIVERY_OUTSIDE_LIMA')

        expect(
            buildCheckoutDraft(
                draft({
                    delivery_type: 'envio',
                    delivery_ubigeo_id: '150101',
                    delivery_address_data: { ubigeo1: { province: 'Lima' } },
                }),
                { ...context, deliveryArticleId: 'article-delivery' },
            ).delivery_address_data.ubigeo1,
        ).toEqual({ province: 'Lima' })
    })

    it('el servidor guarda el punto de retiro oficial y descarta una dirección manipulada', () => {
        const order = buildCheckoutDraft(
            draft({
                delivery_address: 'Dirección inventada',
                delivery_address_data: {
                    punto_retiro: { name: 'Local inventado' },
                    horario: 'Todo el día',
                },
            }),
            context,
        )

        expect(order.delivery_address).toBe(
            'Cal. 7 Mza. D Lote 10 Urb. Los Productores, Santa Anita',
        )
        expect(order.delivery_address_data).toEqual({
            punto_retiro: {
                id: 'planta-sunka',
                name: 'Planta Sunka',
                direccion: 'Cal. 7 Mza. D Lote 10 Urb. Los Productores, Santa Anita',
            },
            horario: '8:00 a. m. a 4:00 p. m.',
        })
    })

    it('el servidor rechaza puntos de retiro que no pertenecen al catálogo', () => {
        expect(() =>
            buildCheckoutDraft(draft({ punto_retiro: 'local-inventado' }), context),
        ).toThrow('INVALID_PICKUP_LOCATION')
    })
})

describe('datos de facturación del pedido', () => {
    const shipping = {
        delivery_type: 'envio',
        delivery_ubigeo_id: '150101',
        delivery_address_data: { ubigeo1: { province: 'Lima' } },
        partner_order_lines: [{ article_id: 'product-1', quantity: 1, unit_price: 20 }],
    }

    it('conserva el tipo de comprobante elegido por el cliente', () => {
        expect(buildCheckoutDraft(draft({ invoice_type: '03' }), context)).toMatchObject({
            invoice_type: '03',
        })
        expect(buildCheckoutDraft(draft({ invoice_type: '01' }), context)).toMatchObject({
            invoice_type: '01',
        })
        expect(buildCheckoutDraft(draft({ invoice_type: 'NV' }), context)).toMatchObject({
            invoice_type: 'NV',
        })
    })

    it('descarta la serie enviada por el navegador', () => {
        const order = buildCheckoutDraft(
            draft({
                invoice_type: '03',
                invoice_series: 'B999',
                invoice_series_id: 'serie-manipulada',
            }),
            context,
        )
        expect(order).toMatchObject({ invoice_type: '03' })
        expect('invoice_series' in order).toBe(false)
        expect('invoice_series_id' in order).toBe(false)
    })

    it('envía el artículo de delivery configurado y descarta el del navegador', () => {
        const order = buildCheckoutDraft(
            draft({ ...shipping, delivery_article_id: 'articulo-manipulado' }),
            { ...context, deliveryArticleId: 'article-delivery' },
        )
        expect(order.delivery_cost).toBe(10)
        expect(order.delivery_article_id).toBe('article-delivery')
    })

    it('no envía artículo de delivery cuando el pedido no cobra envío', () => {
        const order = buildCheckoutDraft(draft(), {
            ...context,
            deliveryArticleId: 'article-delivery',
        })
        expect(order.delivery_cost).toBe(0)
        expect('delivery_article_id' in order).toBe(false)
    })

    it('el BFF responde 503 si falta el artículo de delivery', async () => {
        vi.stubEnv('ERP_GUEST_PARTNER_ID', 'partner-invitado')
        vi.stubEnv('ERP_DELIVERY_ARTICLE_ID', '')
        const result = await prepareCheckoutOrder(
            { cookies: { has: () => false } } as any,
            draft({ ...shipping, delivery_date: getMinimumDeliveryDate() }),
        )
        expect(result.ok).toBe(false)
        expect(result.status).toBe(503)
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })
})
