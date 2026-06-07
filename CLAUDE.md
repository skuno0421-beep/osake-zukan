# osake-zukan

飲んだ日本酒を記録・管理するWebアプリケーション。複数人で共有し、酒の詳細情報・写真・感想を蓄積する「日本酒図鑑」。

## 技術スタック

- **フロントエンド**: Next.js (App Router) + TypeScript + Tailwind CSS
- **バックエンド / DB**: Supabase (PostgreSQL + Auth + Storage)
- **デプロイ**: Vercel
- **外部連携**: [Sakenomy](https://www.sakenomy.jp/) — 酒名検索・基本情報の自動補完

## アーキテクチャ概要

```
/app
  /sake          # 日本酒一覧ページ
  /sake/[id]     # 日本酒詳細ページ
  /sake/new      # 新規追加フォーム
  /sake/[id]/edit # 編集フォーム
  /map           # 日本地図ページ
  /invite        # 招待リンク受け取りページ
/components
  /sake          # SakeCard, SakeList, SakeForm など
  /map           # JapanMap, PrefectureTooltip など
  /ui            # 共通UIコンポーネント
/lib
  supabase.ts    # Supabaseクライアント
  sakenomy.ts    # Sakenomy スクレイピング / 検索ロジック
  mapColor.ts    # 都道府県ごとの件数→色変換ロジック
```

## データベース設計

### `profiles` テーブル
| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK, FK → auth.users) | ユーザーID |
| display_name | text | 表示名 |
| created_at | timestamptz | 作成日時 |

### `sake_records` テーブル
| カラム | 型 | 必須 | 説明 |
|---|---|---|---|
| id | uuid (PK) | ✓ | レコードID |
| user_id | uuid (FK → profiles) | ✓ | 記録者 |
| name | text | ✓ | 銘柄名 |
| brewery | text | ✓ | 蔵元・メーカー |
| drunk_at | date | ✓ | 飲んだ日付 |
| rating | int (1–5) | ✓ | 評価（5段階） |
| type | text | | 種類（大吟醸・純米など） |
| seimaibuai | int | | 精米歩合（%） |
| rice | text | | 使用米 |
| alcohol | numeric | | アルコール度数（%） |
| acidity | numeric | | 酸度 |
| sake_meter | numeric | | 日本酒度 |
| region | text | | 産地・都道府県 |
| location | text | | 飲んだ場所・店名 |
| price | int | | 金額（円） |
| notes | text | | メモ・感想 |
| photo_url | text | | 写真URL（Supabase Storage） |
| created_at | timestamptz | ✓ | 作成日時 |
| updated_at | timestamptz | ✓ | 更新日時 |

### `invitations` テーブル
| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | 招待ID |
| invited_by | uuid (FK → profiles) | 招待した人 |
| token | text (unique) | 招待トークン（URLに含める） |
| used_by | uuid (FK → profiles, nullable) | 使用したユーザー |
| expires_at | timestamptz | 有効期限（発行から7日） |
| created_at | timestamptz | 作成日時 |

## 機能一覧

### 認証・ユーザー管理
- 招待制サインアップ（招待リンクを持つ人のみ登録可能）
- メール + パスワード認証（Supabase Auth）
- 招待リンク発行（有効期限7日）

### 日本酒記録 CRUD
- 一覧表示（カード形式 / リスト形式 切り替え可能）
- 詳細表示
- 新規追加・編集・削除
- 写真アップロード（Supabase Storage）

### 検索・フィルター（最優先機能）
- 銘柄名・蔵元でのフリーワード検索
- 種類・産地・評価でのフィルタリング
- 飲んだ日付での並び替え・絞り込み

### 日本地図ビジュアライゼーション
- `/map` ページに SVG ベースの日本地図を表示
- `sake_records.region`（都道府県）ごとに記録件数を集計し、件数に応じて塗り色を変化させる
- **色の濃度ロジック**（`lib/mapColor.ts` に実装）:
  - 0件: 塗りなし（白 / グレー）
  - 1件: 最も薄い色
  - 件数が増えるごとに段階的に色を濃くする
  - 上限（例: 10件以上）で最も濃い色に固定
  - カラースケール例: `#FFF5E6` → `#FF8C00`（琥珀色グラデーション）
- 都道府県にホバーすると、県名・記録件数・代表銘柄（評価最高のもの）をツールチップ表示
- 都道府県をクリックすると、その産地で絞り込んだ一覧ページへ遷移
- **使用ライブラリ**: `react-simple-maps` または SVG の `<path>` を直接操作（日本地図の TopoJSON / GeoJSON データを使用）

### Sakenomy 連携
- 新規追加フォームで酒名を入力すると Sakenomy を検索
- 検索結果から選択すると銘柄名・蔵元・種類・産地などを自動補完
- 実装方針: サーバーサイドで Sakenomy のページを fetch し、HTML をパースして情報抽出（Next.js Route Handler 経由）

## 環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run lint     # ESLint
```

## Row Level Security (RLS) 方針

- `sake_records`: 全ユーザーが全レコードを閲覧可能（共有DB）、作成・編集・削除は本人のみ
- `profiles`: 全ユーザーが閲覧可能、更新は本人のみ
- `invitations`: 認証済みユーザーのみ作成可能

## 色濃度スケール詳細

| 件数 | 色 | 備考 |
|---|---|---|
| 0 | `#F0F0F0`（グレー） | 未記録 |
| 1 | `#FFF0D0` | 非常に薄い琥珀 |
| 2–3 | `#FFCC80` | 薄い琥珀 |
| 4–6 | `#FFA040` | 中程度の琥珀 |
| 7–9 | `#E07010` | 濃い琥珀 |
| 10以上 | `#A04000` | 最も濃い琥珀（上限） |

件数の上限・閾値は定数として `lib/mapColor.ts` に切り出し、調整しやすくする。

## 実装上の注意

- 日本地図は `react-simple-maps` + 日本の GeoJSON（`japan.topojson`）を使用。件数→色変換は `lib/mapColor.ts` の純粋関数として実装し、テスト可能にする
- Sakenomy スクレイピングはサーバーサイド Route Handler でのみ行う（CORS回避）
- 写真は Supabase Storage の `sake-photos` バケットに保存し、URLをDBに記録
- 招待トークンは `crypto.randomUUID()` で生成
- 日付は全てタイムゾーンを考慮し、日本時間（Asia/Tokyo）で表示
