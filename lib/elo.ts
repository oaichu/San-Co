/** ELO chuẩn, K=32. result: 1 = a thắng, 0.5 = hòa, 0 = a thua */
export function eloDelta(ra: number, rb: number, result: 1 | 0.5 | 0, k = 32): number {
  const expected = 1 / (1 + Math.pow(10, (rb - ra) / 400));
  return Math.round(k * (result - expected));
}
