export type SalesLine = { price: string; orders: string; days: string };
export type Season = { highMonths: string; highPercent: string; lowMonths: string; lowPercent: string };

export function projectSales(lines: SalesLine[], season: Season) {
  const decimal = /^\d{1,7}(?:[.,]\d{1,2})?$/;
  const whole = /^\d{1,6}$/;
  if (!lines.length || lines.some(({ price, orders, days }) =>
    !decimal.test(price) || !whole.test(orders) || !whole.test(days) || Number(days) > 31)) {
    return { error: "Completa precio, pedidos y días de cada producto. Usa hasta 31 días de atención." } as const;
  }
  const seasonValues = Object.values(season);
  if (seasonValues.some((value) => value !== "" && !whole.test(value))) {
    return { error: "Indica meses y porcentajes estacionales con números enteros." } as const;
  }
  const high = Number(season.highMonths);
  const low = Number(season.lowMonths);
  const increase = Number(season.highPercent);
  const decrease = Number(season.lowPercent);
  if (high + low > 12 || increase > 1000 || decrease > 100 || (high > 0 && !season.highPercent) || (low > 0 && !season.lowPercent)) {
    return { error: "Distribuye hasta 12 meses e indica la variación de cada temporada. La baja admite hasta 100 % y el aumento hasta 1 000 %." } as const;
  }

  const regular = lines.reduce((sum, line) =>
    sum + Math.round(Number(line.price.replace(",", ".")) * 100) * Number(line.orders) * Number(line.days), 0);
  if (regular > 99_999_999_999_900) return { error: "La proyección supera el importe máximo admitido." } as const;
  const peak = Math.round(regular * (1 + increase / 100));
  const quiet = Math.round(regular * (1 - decrease / 100));
  const normalMonths = 12 - high - low;
  const months = [
    ...(normalMonths ? [regular] : []), ...(high ? [peak] : []), ...(low ? [quiet] : []),
  ];
  const annual = (normalMonths * regular + high * peak + low * quiet) / 100;
  if (annual > 999_999_999_999) return { error: "La proyección supera el importe máximo admitido." } as const;
  return { value: { annual, regularMonth: regular / 100, maxMonth: Math.max(...months) / 100, lowMonth: Math.min(...months) / 100 } } as const;
}

export type SalesProjection = NonNullable<ReturnType<typeof projectSales>["value"]>;
