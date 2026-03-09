// src/lib/utils/formatters.ts
export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS', // Enforced ARS formatting per user request
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
