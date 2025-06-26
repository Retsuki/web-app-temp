// src/utils/clean-object.ts

/**
 * dataからundefinedの値を除外する
 *
 * @param obj
 * @returns
 */
export function cleanObject<T extends object>(obj: T): Partial<T> {
	return Object.fromEntries(
		Object.entries(obj).filter(([_, value]) => value !== undefined),
	) as Partial<T>;
}
