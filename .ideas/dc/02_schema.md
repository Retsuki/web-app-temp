# Supabase スキーマ設計（MVP）

本ドキュメントは「Create Your Dashboard in 5 MINUTES」を実現するためのMVP向けテーブル設計です。ユーザーがプロジェクトを作成し、SDK からイベントを収集し、AI が提案したイベント定義・コホート定義を元にダッシュボード（ファネル/フロー/リテンション/ヒートマップ/カスタムグラフ/世界地図）を構成できることを目標とします。

設計方針
- テーブル名は全て `dc_` プレフィックスを付与（例: `dc_projects`）
- ユーザー情報は既存の `profiles` テーブルを再利用（`profiles.user_id = auth.uid()`）
- マルチプロジェクト対応（単一オーナー制。共有は将来拡張で対応）
- イベントは `dc_events` にフラットに保管、柔軟性確保のため `jsonb` を採用
- AI 提案は `dc_event_definitions` と `dc_cohort_definitions` に保存
- ダッシュボードは `dc_dashboards` と `dc_dashboard_widgets` で構成・レイアウト管理
- 導入先アプリのエンドユーザーを `dc_end_users`、セッションを `dc_sessions` で管理

注意
- 将来の Stripe 連携や外部サービス連携は拡張を想定（本MVPではスキーマのみ触れます）

---

## 既存テーブル: profiles（再利用）
- 目的: 既存の `api/src/drizzle/db/schema.ts` で定義済みの `profiles` を利用
- 参照列: `profiles.user_id` は Supabase Auth の `auth.uid()` と一致（Drizzle 側の `userId`）
- 本スキーマでは新規作成しない（参照のみ）

---

## テーブル: dc_projects
- 目的: トラッキング対象アプリ単位のプロジェクト
- 主キー: `id` (uuid)

カラム
- `id` (uuid, PK, default gen_random_uuid())
- `name` (text, not null)
- `slug` (text, unique) — 表示/URL 用
- `description` (text)
- `owner_user_id` (uuid, not null, references `profiles(user_id)`) — 作成者（AuthユーザーID）
- `ingest_public_key` (text, not null, unique) — SDK から送信時に利用（公開可）
- `ingest_secret_key` (text, not null) — サーバ間通信や管理用（機密）
- `allowed_domains` (text[]) — SDK 受信許可ドメイン
- `status` (text) — active, archived 等
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

インデックス
- `dc_projects_owner_idx` on (`owner_user_id`)
- `dc_projects_slug_key` (unique)


---

## テーブル: dc_project_members（MVPでは不要）
- 本MVPではプロジェクト共有・招待機能を提供しないため当テーブルは作成しない

---

## テーブル: dc_end_users
- 目的: 導入アプリ側のエンドユーザー（訪問者/会員）を識別
- 主キー: `id` (uuid)

カラム
- `id` (uuid, PK, default gen_random_uuid())
- `project_id` (uuid, not null, references `dc_projects(id)` on delete cascade)
- `external_id` (text) — 導入アプリのユーザーID（ログインユーザー）
- `anonymous_id` (text) — Cookie/デバイス等の匿名ID
- `first_seen_at` (timestamptz)
- `last_seen_at` (timestamptz)
- `properties` (jsonb, default '{}') — 任意プロファイル（地域/プラン等）

インデックス
- `dc_end_users_project_idx` on (`project_id`)
- `dc_end_users_external_unique` unique (`project_id`, `external_id`) nulls not distinct
- `dc_end_users_anonymous_idx` on (`project_id`, `anonymous_id`)


---

## テーブル: dc_sessions
- 目的: エンドユーザーの訪問セッション管理（フロー/リテンション解析に利用）
- 主キー: `id` (uuid)

カラム
- `id` (uuid, PK, default gen_random_uuid())
- `project_id` (uuid, not null, references `dc_projects(id)` on delete cascade)
- `end_user_id` (uuid, references `dc_end_users(id)` on delete set null)
- `started_at` (timestamptz, not null)
- `ended_at` (timestamptz)
- `duration_ms` (bigint) — 集計用
- `utm` (jsonb, default '{}') — utm_source/medium/campaign 等
- `referrer` (text)
- `user_agent` (text)
- `geo` (jsonb, default '{}') — country/region/city など

インデックス
- `dc_sessions_project_time_idx` on (`project_id`, `started_at` desc)
- `dc_sessions_end_user_idx` on (`project_id`, `end_user_id`)


---

## テーブル: dc_event_definitions
- 目的: 収集するイベントの定義（AI 提案や手動定義を保存）
- 主キー: `id` (uuid)

カラム
- `id` (uuid, PK, default gen_random_uuid())
- `project_id` (uuid, not null, references `dc_projects(id)` on delete cascade)
- `event_key` (text, not null) — SDK 送信時に使用するキー
- `name` (text) — 管理画面表示名
- `description` (text)
- `properties_schema` (jsonb, default '{}') — 期待プロパティのスキーマ/型情報
- `created_by` (uuid, references `profiles(user_id)`)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

制約/インデックス
- unique (`project_id`, `event_key`)
- `dc_event_definitions_project_idx` on (`project_id`)


---

## テーブル: dc_cohort_definitions
- 目的: コホートの定義（AI 提案や手動定義を保存）
- 主キー: `id` (uuid)

カラム
- `id` (uuid, PK, default gen_random_uuid())
- `project_id` (uuid, not null, references `dc_projects(id)` on delete cascade)
- `name` (text, not null)
- `description` (text)
- `criteria` (jsonb, default '{}') — 定義式（例: 条件のDSL/プリセット）
- `created_by` (uuid, references `profiles(user_id)`)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

インデックス
- `dc_cohort_definitions_project_idx` on (`project_id`)


---

## テーブル: dc_dashboards
- 目的: プロジェクト内のダッシュボード（1..n）
- 主キー: `id` (uuid)

カラム
- `id` (uuid, PK, default gen_random_uuid())
- `project_id` (uuid, not null, references `dc_projects(id)` on delete cascade)
- `name` (text, not null)
- `description` (text)
- `layout` (jsonb, default '{}') — グリッド配置情報
- `created_by` (uuid, references `profiles(user_id)`)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

インデックス
- `dc_dashboards_project_idx` on (`project_id`)


---

## テーブル: dc_dashboard_widgets
- 目的: ダッシュボード上の各ウィジェット（ファネル/フロー/リテンション/ヒートマップ/カスタム/世界地図）
- 主キー: `id` (uuid)

カラム
- `id` (uuid, PK, default gen_random_uuid())
- `dashboard_id` (uuid, not null, references `dc_dashboards(id)` on delete cascade)
- `type` (text, not null) — funnel | flow | retention | heatmap | custom_chart | world_map
- `title` (text)
- `config` (jsonb, default '{}') — 紐付くイベント/コホート/指標/期間 等
- `position` (jsonb, default '{}') — x, y, w, h 等
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

インデックス
- `dc_dashboard_widgets_dashboard_idx` on (`dashboard_id`)


---

## テーブル: dc_events
- 目的: 受信した生イベント（解析の最小単位）
- 主キー: `id` (bigint, identity) もしくは `uuid`

カラム
- `id` (bigint, PK, generated by default as identity)
- `project_id` (uuid, not null, references `dc_projects(id)` on delete cascade)
- `event_definition_id` (uuid, references `dc_event_definitions(id)` on delete set null)
- `end_user_id` (uuid, references `dc_end_users(id)` on delete set null)
- `session_id` (uuid, references `dc_sessions(id)` on delete set null)
- `event_key` (text, not null) — 冗長保持（検索容易化）
- `occurred_at` (timestamptz, not null) — クライアント発生時刻
- `received_at` (timestamptz, not null, default now()) — 受信時刻
- `source` (text) — web, ios, android, server 等
- `page` (jsonb, default '{}') — page_url, path, title 等
- `device` (jsonb, default '{}') — os, browser, version 等
- `geo` (jsonb, default '{}') — country, region, city 等
- `properties` (jsonb, default '{}') — 任意プロパティ（定義に合致/不一致も許容）

インデックス
- `dc_events_project_time_idx` on (`project_id`, `occurred_at` desc)
- `dc_events_project_event_idx` on (`project_id`, `event_key`, `occurred_at` desc)
- `dc_events_project_definition_idx` on (`project_id`, `event_definition_id`, `occurred_at` desc)
- `dc_events_end_user_idx` on (`project_id`, `end_user_id`, `occurred_at` desc)
- `dc_events_session_idx` on (`project_id`, `session_id`, `occurred_at` desc)
- `dc_events_properties_gin` on (`properties`) using GIN


## テーブル: dc_agg_events_daily

- 目的: UI のトレンド表示を高速化（イベント量増加時でも安定応答）
- 対象: MVPで作成・運用する前提
- 粒度: 日次（UTC 起点。必要に応じてタイムゾーン調整）
- 入力: `dc_events`（`occurred_at`, `event_key`, `end_user_id` 等）+ `dc_event_definitions`（`(project_id,event_key)→id` 解決）
- 更新: 増分Upsert（例: 5–15分間隔）。水位（from_ts/to_ts）で差分集計

カラム（event_definition_id を冗長保持）
- `project_id` (uuid, not null)
- `day` (date, not null)
- `event_key` (text, not null)
- `event_definition_id` (uuid, references `dc_event_definitions(id)` on delete set null)
- `total_count` (bigint, not null)
- `unique_users` (bigint, not null) — `end_user_id` の distinct
- `updated_at` (timestamptz, default now())

制約/インデックス
- primary key (`project_id`, `day`, `event_key`)
- `dc_agg_events_daily_project_day_idx` on (`project_id`, `day` desc)
- `dc_agg_events_daily_project_event_day_idx` on (`project_id`, `event_key`, `day` desc)
- `dc_agg_events_daily_project_def_day_idx` on (`project_id`, `event_definition_id`, `day` desc)

SQL（例）
```sql
create table if not exists dc_agg_events_daily (
  project_id uuid not null,
  day date not null,
  event_key text not null,
  event_definition_id uuid references dc_event_definitions(id) on delete set null,
  total_count bigint not null,
  unique_users bigint not null,
  updated_at timestamptz default now(),
  primary key (project_id, day, event_key)
);
create index if not exists dc_agg_events_daily_project_day_idx
  on dc_agg_events_daily(project_id, day desc);
create index if not exists dc_agg_events_daily_project_event_day_idx
  on dc_agg_events_daily(project_id, event_key, day desc);
create index if not exists dc_agg_events_daily_project_def_day_idx
  on dc_agg_events_daily(project_id, event_definition_id, day desc);
```

増分Upsert（疑似コード）
```sql
insert into dc_agg_events_daily (
  project_id, day, event_key, event_definition_id, total_count, unique_users
)
select
  e.project_id,
  (e.occurred_at at time zone 'UTC')::date as day,
  e.event_key,
  max(d.id) as event_definition_id, -- 定義が存在すれば付与（なければ null）
  count(*) as total_count,
  count(distinct e.end_user_id) as unique_users
from dc_events e
left join dc_event_definitions d
  on d.project_id = e.project_id and d.event_key = e.event_key
where e.occurred_at > :from_ts and e.occurred_at <= :to_ts
group by e.project_id, day, e.event_key
on conflict (project_id, day, event_key) do update set
  event_definition_id = coalesce(excluded.event_definition_id, dc_agg_events_daily.event_definition_id),
  total_count = dc_agg_events_daily.total_count + excluded.total_count,
  unique_users = dc_agg_events_daily.unique_users + excluded.unique_users,
  updated_at = now();
```

---
