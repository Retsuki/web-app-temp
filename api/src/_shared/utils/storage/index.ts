// apps/backend/src/utils/storage/index.ts

import { supabase } from "../../libs/supabase/index.js";

/**
 * Supabase Storage上のファイルを削除するユーティリティ関数
 * @param fileUrl - 例: "profile-images/users/{userId}/xxxxx.jpg"
 * @returns true: 削除成功, false: 削除失敗
 */
export async function deleteFileFromStorage(fileUrl: string): Promise<boolean> {
	try {
		// 1) fileUrl から bucketName と filePath を分離
		//    例: "profile-images/users/xyz/filename.jpg"
		const [bucketName, ...rest] = fileUrl.split("/");
		if (!bucketName || rest.length === 0) {
			console.error(`Invalid fileUrl format: ${fileUrl}`);
			return false;
		}
		const filePath = rest.join("/"); // "users/xyz/filename.jpg"

		// 2) Supabase Storageから remove()
		const { data, error } = await supabase.storage
			.from(bucketName)
			.remove([filePath]);

		if (error) {
			console.error("Failed to remove file from storage:", error);
			return false;
		}
		console.log("File removed from storage:", data);
		return true;
	} catch (error) {
		console.error("Unexpected error while deleting file:", error);
		return false;
	}
}
