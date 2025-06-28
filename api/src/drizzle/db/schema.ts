import { relations, sql } from "drizzle-orm";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ユーザープロフィールテーブル
export const profiles = pgTable("profiles", {
  // ユーザーを一意に識別するUUID
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),

  // Supabase AuthのユーザーID (auth.usersのUUIDに対応)
  userId: uuid("user_id").notNull().unique(),

  // ニックネーム
  nickname: varchar("nickname", { length: 50 }).notNull(),

  // メールアドレス
  email: varchar("email", { length: 255 }).notNull().unique(),

  // 作成日時
  createdAt: timestamp("created_at").default(sql`now()`),

  // 更新日時
  updatedAt: timestamp("updated_at").default(sql`now()`),

  // 削除日時（論理削除）
  deletedAt: timestamp("deleted_at"),
});

// リレーション定義
export const profilesRelations = relations(profiles, ({}) => ({}));
