export function extractTiet(ca: string): number[] {
  if (!ca) return [];

  const match = ca.match(/\d+/g);
  if (!match) return [];

  if (match.length === 1) {
    return [Number(match[0])];
  }

  const start = Number(match[0]);
  const end = Number(match[1]);
  const list: number[] = [];

  for (let i = start; i <= end; i++) {
    list.push(i);
  }

  return list;
}

export function rangeOfTiet(ca_dau: string, ca_cuoi: string): number[] {
  const startArr = extractTiet(ca_dau);
  const endArr = extractTiet(ca_cuoi);

  if (!startArr.length || !endArr.length) return [];

  const start = startArr[0];
  const end = endArr[0];

  const list: number[] = [];
  for (let i = start; i <= end; i++) list.push(i);

  return list;
}

export function isTietConflict(
  thuA: string,
  tietA: number[],
  thuB: string,
  tietB: number[]
): boolean {
  if (!thuA || !thuB) return false;
  if (thuA !== thuB) return false;

  return tietA.some(t => tietB.includes(t));
}

export function isScheduleConflict(
  newThu: string,
  newTiet: number[],
  existingList: { thu: string; tiet: number[] }[]
): boolean {
  if (!existingList || !Array.isArray(existingList)) return false;

  for (const item of existingList) {
    if (isTietConflict(newThu, newTiet, item.thu, item.tiet)) {
      return true;
    }
  }
  return false;
}

export function chooseBestThu(): string[] {
  return ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
}

export function chooseCaHoc(caHocList: { ca: string }[]): string[] {
  if (!Array.isArray(caHocList)) return [];

  return caHocList
    .map(c => c?.ca)
    .filter(x => typeof x === "string" && x.trim().length > 0);
}

export function tietFromCa(ca: string): number[] {
  return extractTiet(ca);
}
