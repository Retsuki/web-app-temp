# Hooks

> シェルコマンドを登録してClaude Codeの動作をカスタマイズ・拡張

# はじめに

Claude Codeのフック機能は、Claude Codeのライフサイクルの様々なポイントで実行されるユーザー定義のシェルコマンドです。フックはClaude Codeの動作を確定的に制御し、LLMが選択して実行するのではなく、特定のアクションが常に実行されることを保証します。

使用例：

* **通知**: Claude Codeが入力や実行許可を待っている時の通知方法をカスタマイズ
* **自動フォーマット**: ファイル編集後に`.ts`ファイルに`prettier`、`.go`ファイルに`gofmt`などを実行
* **ロギング**: コンプライアンスやデバッグのために実行されたコマンドを追跡・カウント
* **フィードバック**: Claude Codeがコードベースの規約に従わないコードを生成した時に自動フィードバックを提供
* **カスタム権限**: 本番ファイルや機密ディレクトリへの変更をブロック

プロンプトの指示ではなくフックとしてこれらのルールをエンコードすることで、提案をアプリレベルのコードに変換し、期待されるたびに確実に実行されます。

⚠️ **警告**
フックは確認なしにフルユーザー権限でシェルコマンドを実行します。フックが安全でセキュアであることを確認する責任はあなたにあります。Anthropicはフック使用による データ損失やシステム損傷について一切責任を負いません。[セキュリティの考慮事項](#セキュリティの考慮事項)を確認してください。

## クイックスタート

このクイックスタートでは、Claude Codeが実行するシェルコマンドをログに記録するフックを追加します。

前提条件：コマンドラインでJSONを処理するために`jq`をインストールしてください。

### ステップ1：フック設定を開く

`/hooks` [スラッシュコマンド](/en/docs/claude-code/slash-commands)を実行し、`PreToolUse`フックイベントを選択します。

`PreToolUse`フックはツール呼び出しの前に実行され、それらをブロックしながらClaudeに異なる動作をするようフィードバックを提供できます。

### ステップ2：マッチャーを追加

`+ Add new matcher…`を選択して、Bashツール呼び出しのみでフックを実行するようにします。

マッチャーに`Bash`と入力します。

### ステップ3：フックを追加

`+ Add new hook…`を選択し、このコマンドを入力します：

```bash
jq -r '"\(.tool_input.command) - \(.tool_input.description // "No description")"' >> ~/.claude/bash-command-log.txt
```

### ステップ4：設定を保存

保存場所は、ホームディレクトリにログを記録するため`User settings`を選択します。このフックは現在のプロジェクトだけでなく、すべてのプロジェクトに適用されます。

その後、REPLに戻るまでEscを押します。フックが登録されました！

### ステップ5：フックを確認

`/hooks`を再度実行するか、`~/.claude/settings.json`を確認して設定を見ることができます：

```json
"hooks": {
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "command": "jq -r '\"\\(.tool_input.command) - \\(.tool_input.description // \"No description\")\"' >> ~/.claude/bash-command-log.txt"
        }
      ]
    }
  ]
}
```

## 設定

Claude Codeのフックは[設定ファイル](/en/docs/claude-code/settings)で設定されます：

* `~/.claude/settings.json` - ユーザー設定
* `.claude/settings.json` - プロジェクト設定
* `.claude/settings.local.json` - ローカルプロジェクト設定（コミットされない）
* エンタープライズ管理ポリシー設定

### 構造

フックはマッチャーごとに整理され、各マッチャーは複数のフックを持つことができます：

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here"
          }
        ]
      }
    ]
  }
}
```

* **matcher**: ツール名にマッチするパターン（`PreToolUse`と`PostToolUse`にのみ適用）
  * 単純な文字列は完全一致：`Write`はWriteツールのみにマッチ
  * 正規表現をサポート：`Edit|Write`または`Notebook.*`
  * 省略または空文字列の場合、すべてのマッチングイベントでフックが実行
* **hooks**: パターンがマッチした時に実行するコマンドの配列
  * `type`: 現在は`"command"`のみサポート
  * `command`: 実行するbashコマンド

## フックイベント

### PreToolUse

Claudeがツールパラメータを作成した後、ツール呼び出しを処理する前に実行されます。

**一般的なマッチャー：**

* `Task` - エージェントタスク
* `Bash` - シェルコマンド
* `Glob` - ファイルパターンマッチング
* `Grep` - コンテンツ検索
* `Read` - ファイル読み取り
* `Edit`, `MultiEdit` - ファイル編集
* `Write` - ファイル書き込み
* `WebFetch`, `WebSearch` - Web操作

### PostToolUse

ツールが正常に完了した直後に実行されます。

PreToolUseと同じマッチャー値を認識します。

### Notification

Claude Codeが通知を送信する時に実行されます。

### Stop

Claude Codeが応答を終了した時に実行されます。

## フック入力

フックはセッション情報とイベント固有のデータを含むJSONデータをstdin経由で受け取ります：

```typescript
{
  // 共通フィールド
  session_id: string
  transcript_path: string  // 会話JSONへのパス

  // イベント固有のフィールド
  ...
}
```

### PreToolUse入力

`tool_input`の正確なスキーマはツールに依存します。

```json
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../00893aaf-19fa-41d2-8238-13269b9b3ca0.jsonl",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  }
}
```

### PostToolUse入力

`tool_input`と`tool_response`の正確なスキーマはツールに依存します。

```json
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../00893aaf-19fa-41d2-8238-13269b9b3ca0.jsonl",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  },
  "tool_response": {
    "filePath": "/path/to/file.txt",
    "success": true
  }
}
```

### Notification入力

```json
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../00893aaf-19fa-41d2-8238-13269b9b3ca0.jsonl",
  "message": "Task completed successfully",
  "title": "Claude Code"
}
```

### Stop入力

`stop_hook_active`は、stopフックの結果としてClaude Codeがすでに継続している場合にtrueになります。この値を確認するか、トランスクリプトを処理して、Claude Codeが無限に実行されないようにしてください。

```json
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../00893aaf-19fa-41d2-8238-13269b9b3ca0.jsonl",
  "stop_hook_active": true
}
```

## フック出力

フックがClaude Codeに出力を返す方法は2つあります。出力はブロックするかどうか、およびClaudeとユーザーに表示されるフィードバックを通信します。

### シンプル：終了コード

フックは終了コード、stdout、stderrを通じてステータスを通信します：

* **終了コード0**: 成功。`stdout`はトランスクリプトモード（CTRL-R）でユーザーに表示されます。
* **終了コード2**: ブロッキングエラー。`stderr`はClaudeに自動的に処理されるようフィードバックされます。以下のフックイベントごとの動作を参照してください。
* **その他の終了コード**: 非ブロッキングエラー。`stderr`はユーザーに表示され、実行は継続されます。

#### 終了コード2の動作

| フックイベント | 動作 |
| -------------- | ------------------------------------------- |
| `PreToolUse`   | ツール呼び出しをブロックし、エラーをClaudeに表示 |
| `PostToolUse`  | エラーをClaudeに表示（ツールはすでに実行済み） |
| `Notification` | N/A、stderrをユーザーにのみ表示 |
| `Stop`         | 停止をブロックし、エラーをClaudeに表示 |

### 高度：JSON出力

フックはより洗練された制御のために`stdout`に構造化されたJSONを返すことができます：

#### 共通JSONフィールド

すべてのフックタイプにはこれらのオプションフィールドを含めることができます：

```json
{
  "continue": true, // フック実行後にClaudeが継続すべきかどうか（デフォルト：true）
  "stopReason": "string" // continueがfalseの時に表示されるメッセージ
  "suppressOutput": true, // トランスクリプトモードからstdoutを隠す（デフォルト：false）
}
```

`continue`がfalseの場合、フックが実行された後にClaudeは処理を停止します。

* `PreToolUse`の場合、これは特定のツール呼び出しのみをブロックしてClaudeに自動フィードバックを提供する`"decision": "block"`とは異なります。
* `PostToolUse`の場合、これはClaudeに自動フィードバックを提供する`"decision": "block"`とは異なります。
* `Stop`の場合、これはすべての`"decision": "block"`出力よりも優先されます。
* すべての場合において、`"continue" = false`はすべての`"decision": "block"`出力よりも優先されます。

`stopReason`は`continue`に伴い、ユーザーに表示される理由を示しますが、Claudeには表示されません。

#### `PreToolUse`決定制御

`PreToolUse`フックはツール呼び出しが進行するかどうかを制御できます。

* "approve"は権限システムをバイパスします。`reason`はユーザーに表示されますが、Claudeには表示されません。
* "block"はツール呼び出しの実行を防ぎます。`reason`はClaudeに表示されます。
* `undefined`は既存の権限フローにつながります。`reason`は無視されます。

```json
{
  "decision": "approve" | "block" | undefined,
  "reason": "決定の説明"
}
```

#### `PostToolUse`決定制御

`PostToolUse`フックはツール呼び出しが進行するかどうかを制御できます。

* "block"は自動的に`reason`でClaudeにプロンプトを表示します。
* `undefined`は何もしません。`reason`は無視されます。

```json
{
  "decision": "block" | undefined,
  "reason": "決定の説明"
}
```

#### `Stop`決定制御

`Stop`フックはClaudeが継続する必要があるかどうかを制御できます。

* "block"はClaudeが停止することを防ぎます。Claudeが進行方法を知るために`reason`を入力する必要があります。
* `undefined`はClaudeが停止することを許可します。`reason`は無視されます。

```json
{
  "decision": "block" | undefined,
  "reason": "Claudeが停止をブロックされた時に提供する必要があります"
}
```

#### JSON出力の例：Bashコマンド編集

```python
#!/usr/bin/env python3
import json
import re
import sys

# バリデーションルールを（正規表現パターン、メッセージ）のタプルのリストとして定義
VALIDATION_RULES = [
    (
        r"\bgrep\b(?!.*\|)",
        "より良いパフォーマンスと機能のために'grep'の代わりに'rg'（ripgrep）を使用してください",
    ),
    (
        r"\bfind\s+\S+\s+-name\b",
        "より良いパフォーマンスのために'find -name'の代わりに'rg --files | rg pattern'または'rg --files -g pattern'を使用してください",
    ),
]


def validate_command(command: str) -> list[str]:
    issues = []
    for pattern, message in VALIDATION_RULES:
        if re.search(pattern, command):
            issues.append(message)
    return issues


try:
    input_data = json.load(sys.stdin)
except json.JSONDecodeError as e:
    print(f"エラー: 無効なJSON入力: {e}", file=sys.stderr)
    sys.exit(1)

tool_name = input_data.get("tool_name", "")
tool_input = input_data.get("tool_input", {})
command = tool_input.get("command", "")

if tool_name != "Bash" or not command:
    sys.exit(1)

# コマンドを検証
issues = validate_command(command)

if issues:
    for message in issues:
        print(f"• {message}", file=sys.stderr)
    # 終了コード2はツール呼び出しをブロックし、stderrをClaudeに表示
    sys.exit(2)
```

## MCPツールとの連携

Claude Codeのフックは[Model Context Protocol（MCP）ツール](/en/docs/claude-code/mcp)とシームレスに動作します。MCPサーバーがツールを提供する時、それらは特別な命名パターンで表示され、フックでマッチできます。

### MCPツールの命名

MCPツールは`mcp__<server>__<tool>`のパターンに従います。例：

* `mcp__memory__create_entities` - Memoryサーバーのエンティティ作成ツール
* `mcp__filesystem__read_file` - Filesystemサーバーのファイル読み取りツール
* `mcp__github__search_repositories` - GitHubサーバーの検索ツール

### MCPツール用のフック設定

特定のMCPツールまたはMCPサーバー全体をターゲットにできます：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__memory__.*",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'メモリ操作が開始されました' >> ~/mcp-operations.log"
          }
        ]
      },
      {
        "matcher": "mcp__.*__write.*",
        "hooks": [
          {
            "type": "command",
            "command": "/home/user/scripts/validate-mcp-write.py"
          }
        ]
      }
    ]
  }
}
```

## 例

### コードフォーマット

ファイル変更後に自動的にコードをフォーマット：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "/home/user/scripts/format-code.sh"
          }
        ]
      }
    ]
  }
}
```

### 通知

Claude Codeが許可を要求しているか、プロンプト入力がアイドル状態になった時に送信される通知をカスタマイズ：

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/my_custom_notifier.py"
          }
        ]
      }
    ]
  }
}
```

## セキュリティの考慮事項

### 免責事項

**自己責任で使用してください**: Claude Codeのフックは確認なしにシステム上で任意のシェルコマンドを自動的に実行します。フックを使用することで、以下を認識します：

* 設定するコマンドについては、あなたが全責任を負います
* フックはユーザーアカウントがアクセスできるファイルを変更、削除、アクセスできます
* 悪意のあるまたは不適切に書かれたフックはデータ損失やシステム損傷を引き起こす可能性があります
* Anthropicは保証を提供せず、フック使用による損害について一切責任を負いません
* 本番環境で使用する前に、安全な環境でフックを十分にテストする必要があります

設定に追加する前に、フックコマンドを常に確認し理解してください。

### セキュリティのベストプラクティス

より安全なフックを書くための主要なプラクティス：

1. **入力を検証しサニタイズする** - 入力データを盲目的に信用しない
2. **常にシェル変数を引用符で囲む** - `$VAR`ではなく`"$VAR"`を使用
3. **パストラバーサルをブロック** - ファイルパスの`..`をチェック
4. **絶対パスを使用** - スクリプトのフルパスを指定
5. **機密ファイルをスキップ** - `.env`、`.git/`、キーなどを避ける

### 設定の安全性

設定ファイルのフックへの直接編集はすぐには有効になりません。Claude Codeは：

1. 起動時にフックのスナップショットをキャプチャ
2. セッション全体でこのスナップショットを使用
3. フックが外部で変更された場合に警告
4. 変更を適用するには`/hooks`メニューでの確認が必要

これにより、悪意のあるフックの変更が現在のセッションに影響を与えることを防ぎます。

## フック実行の詳細

* **タイムアウト**: 60秒の実行制限
* **並列化**: マッチするすべてのフックが並列で実行
* **環境**: Claude Codeの環境で現在のディレクトリで実行
* **入力**: stdin経由のJSON
* **出力**:
  * PreToolUse/PostToolUse/Stop: トランスクリプト（Ctrl-R）に進捗表示
  * Notification: デバッグのみにログ（`--debug`）

## デバッグ

フックのトラブルシューティング：

1. `/hooks`メニューに設定が表示されているか確認
2. [設定ファイル](/en/docs/claude-code/settings)が有効なJSONであることを確認
3. コマンドを手動でテスト
4. 終了コードを確認
5. stdoutとstderrのフォーマット要件を確認
6. 適切な引用符のエスケープを確認

進捗メッセージはトランスクリプトモード（Ctrl-R）に表示され、以下を示します：

* 実行中のフック
* 実行されているコマンド
* 成功/失敗ステータス
* 出力またはエラーメッセージ