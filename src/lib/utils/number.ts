export function formatNumber(
    num: number | null | undefined,
    dec = 2,
    useGrouping = true,
) {
    if (num === null || num === undefined) return num

    if (!useGrouping) return num.toFixed(dec)

    return num.toLocaleString('en-US', {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
    })
}
