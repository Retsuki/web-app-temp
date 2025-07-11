import * as fs from 'node:fs'
import * as path from 'node:path'
import * as readline from 'node:readline'

// アイディアディレクトリのパス
const IDEAS_DIR = '../ideas'

// readlineインターフェースを作成
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// ユーザーに質問する関数
function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer)
    })
  })
}

// ディレクトリ名を正規化（URLセーフな文字列に変換）
function normalizeDirectoryName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf]+/g, '-')
    .replace(/^-+|-+$/g, '') // 先頭と末尾のハイフンを削除
    .replace(/-+/g, '-') // 連続するハイフンを1つに
}

// 現在の日時を取得
function getCurrentDateTime(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// メイン処理
async function addIdea() {
  try {
    // アイディアディレクトリが存在しない場合は作成
    if (!fs.existsSync(IDEAS_DIR)) {
      fs.mkdirSync(IDEAS_DIR, { recursive: true })
      console.log(`アイディアディレクトリを作成しました: ${IDEAS_DIR}`)
    }

    // タイトルを入力
    const title = await question('アイディアのタイトルを入力してください: ')
    if (!title.trim()) {
      console.log('タイトルが入力されていません。処理を中止します。')
      rl.close()
      return
    }

    // 説明を入力
    const description = await question('アイディアの説明を入力してください（任意）: ')

    // タグを入力
    const tagsInput = await question('タグをカンマ区切りで入力してください（任意）: ')
    const tags = tagsInput
      ? tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : []

    // ディレクトリ名を生成
    const dirName = normalizeDirectoryName(title)
    const ideaDir = path.join(IDEAS_DIR, dirName)

    // 既に同じ名前のディレクトリが存在する場合は番号を付ける
    let finalIdeaDir = ideaDir
    let counter = 1
    while (fs.existsSync(finalIdeaDir)) {
      finalIdeaDir = `${ideaDir}-${counter}`
      counter++
    }

    // アイディアディレクトリを作成
    fs.mkdirSync(finalIdeaDir, { recursive: true })

    // アイディアファイルの内容を作成
    const ideaContent = `# ${title}

## 作成日時
${getCurrentDateTime()}

## 概要
${description || '（説明なし）'}

## タグ
${tags.length > 0 ? tags.map((tag) => `- ${tag}`).join('\n') : '（タグなし）'}

## 背景・課題
<!-- このアイディアが生まれた背景や解決したい課題を記述 -->


## アイディアの詳細
<!-- アイディアの具体的な内容を記述 -->


## 期待される効果・メリット
<!-- このアイディアを実現することで得られる効果やメリット -->


## 実現に必要なもの
<!-- 技術スタック、リソース、時間など -->


## 参考リンク・情報


## メモ・備考

`

    // システム設計書ファイルの内容を作成
    const systemDesignContent = `# ${title} - システム設計書

## 作成日時
${getCurrentDateTime()}

## 1. システム概要
### 1.1 目的


### 1.2 スコープ


### 1.3 用語定義


## 2. 要件定義
### 2.1 機能要件


### 2.2 非機能要件


## 3. システム構成
### 3.1 アーキテクチャ


### 3.2 技術スタック


### 3.3 インフラ構成


## 4. データ設計
### 4.1 データモデル


### 4.2 データベース設計


## 5. API設計
### 5.1 エンドポイント一覧


### 5.2 API仕様


## 6. 画面設計
### 6.1 画面遷移図


### 6.2 画面一覧


## 7. セキュリティ設計
### 7.1 認証・認可


### 7.2 データ保護


## 8. 実装計画
### 8.1 開発スケジュール


### 8.2 マイルストーン


## 9. テスト計画


## 10. 運用・保守

`

    // アイディアファイルを作成
    const ideaPath = path.join(finalIdeaDir, 'idea.md')
    fs.writeFileSync(ideaPath, ideaContent, 'utf-8')

    // システム設計書ファイルを作成
    const systemDesignPath = path.join(finalIdeaDir, 'system-design.md')
    fs.writeFileSync(systemDesignPath, systemDesignContent, 'utf-8')

    console.log('\nアイディアを追加しました！')
    console.log(`場所: ${finalIdeaDir}`)
    console.log(`アイディアファイル: ${ideaPath}`)
    console.log(`システム設計書: ${systemDesignPath}`)

    rl.close()
  } catch (error) {
    console.error('エラーが発生しました:', error)
    rl.close()
    process.exit(1)
  }
}

// スクリプトを実行
addIdea()
