// src/utils/convertDatesToIso.ts

type WithDates<T> = {
  [K in keyof T]: T[K] extends Date | null | undefined ? string | null | undefined : T[K]
}

/**
 * オブジェクト内のDate型プロパティをISO8601形式の文字列に変換する関数
 *
 * @param obj Date型を含む任意のオブジェクト
 * @returns DateプロパティをISO文字列に置き換えた新しいオブジェクト
 */
export function convertDatesToIso<T extends Record<string, unknown>>(obj: T): WithDates<T> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      result[key] = value.toISOString()
    } else {
      result[key] = value
    }
  }

  return result as WithDates<T>
}

export const convertDateToIso = (date: Date | string | null | undefined) => {
  if (!date) {
    return new Date().toISOString()
  }
  return new Date(date).toISOString()
}
