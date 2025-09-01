import { sql } from "drizzle-orm";
import {
	integer,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

/** 共通ユーザープロフィールテーブル */
export const profiles = pgTable("profiles", {
	// ユーザーを一意に識別するUUID
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

	// Supabase AuthのユーザーID (auth.usersのUUIDに対応)
	userId: uuid("user_id").notNull().unique(),

	// ニックネーム
	nickname: varchar("nickname", { length: 50 }).notNull(),

	// メールアドレス
	email: varchar("email", { length: 255 }).notNull().unique(),

	// 言語設定 (ja, en など)
	language: varchar("language", { length: 10 }).default("ja"),

	// 作成日時
	createdAt: timestamp("created_at").default(sql`now()`),

	// 更新日時
	updatedAt: timestamp("updated_at").default(sql`now()`),

	// 削除日時（論理削除）
	deletedAt: timestamp("deleted_at"),

	// Stripe関連
	stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
	plan: varchar("plan", { length: 50 }).notNull().default("free"), // free, standard, pro
	remainedCredits: integer("remained_credits").notNull().default(500), // 残りクレジット数
});
