# ファイルアップロード機能 ドキュメント

このディレクトリには、Supabase Storageを使用したファイルアップロード機能の設計・実装ドキュメントが含まれています。

## 📚 ドキュメント一覧

### 1. [システム設計書](./system-design.md)
- アーキテクチャ概要
- 機能要件の定義
- Supabase Storage設定
- セキュリティ考慮事項
- パフォーマンス最適化

### 2. [実装ガイド](./implementation-guide.md)
- セットアップ手順
- 実装サンプルコード
- React コンポーネント例
- テスト実装
- トラブルシューティング

## 🚀 クイックスタート

### 必要な環境
- Next.js 15.3.4+
- Supabase プロジェクト
- Node.js 18+

### セットアップ手順

1. **Supabase Storageの有効化**
   ```bash
   # Supabase Dashboardで以下のバケットを作成
   - profile-images (公開)
   - user-documents (非公開)
   - user-files (非公開)
   ```

2. **必要なパッケージのインストール**
   ```bash
   cd web
   npm install react-dropzone
   ```

3. **環境変数の設定**
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_STORAGE_URL=${NEXT_PUBLIC_SUPABASE_URL}/storage/v1
   ```

4. **RLSポリシーの設定**
   - `system-design.md` の 4.2 セクションを参照

## 🔧 主な機能

- ✅ ドラッグ&ドロップ対応
- ✅ 複数ファイル同時アップロード
- ✅ アップロード進捗表示
- ✅ ファイルタイプ/サイズ制限
- ✅ 画像の自動リサイズ
- ✅ サムネイル生成
- ✅ セキュアなファイル管理

## 📁 ディレクトリ構造

```
/web/src/
├── lib/storage/          # Storageユーティリティ
├── hooks/                # カスタムフック
└── components/file-upload/ # UIコンポーネント
```

## 🔒 セキュリティ

- Supabase RLSによるアクセス制御
- ファイル名のサニタイズ
- MIMEタイプ検証
- ユーザーごとのフォルダ分離

## 📊 パフォーマンス

- クライアントサイド画像リサイズ
- 並列アップロード制限
- プログレッシブアップロード
- エラーリトライ機能

## 🛠️ カスタマイズ

各コンポーネントは高度にカスタマイズ可能です：

```tsx
<FileUploadZone
  bucket="profile-images"
  maxFiles={5}
  maxFileSize={10 * 1024 * 1024}
  accept={{
    'image/*': ['.png', '.jpg'],
    'application/pdf': ['.pdf']
  }}
  onUploadComplete={(files) => {
    // カスタムロジック
  }}
/>
```

## 📝 注意事項

1. **バケット作成**: 使用前に必ずSupabase Dashboardでバケットを作成してください
2. **RLSポリシー**: セキュリティのため、適切なRLSポリシーの設定が必須です
3. **エラーハンドリング**: ユーザーフレンドリーなエラーメッセージを実装してください

## 🔗 関連リンク

- [Supabase Storage ドキュメント](https://supabase.com/docs/guides/storage)
- [Next.js ファイルアップロード](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming)
- [React Dropzone](https://react-dropzone.js.org/)

## 💡 Tips

1. **大容量ファイル**: 50MB以上のファイルには resumable upload を検討
2. **画像最適化**: WebP形式への自動変換でストレージを節約
3. **CDN活用**: Supabase StorageはCDN対応なので、適切なキャッシュ設定を

---

質問や提案がある場合は、プロジェクトのIssueトラッカーでお知らせください。