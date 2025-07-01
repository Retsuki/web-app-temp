#!/bin/bash

# Claude Codeの処理完了を通知するスクリプト

# 入力されるJSONデータを読み込む
INPUT=$(cat)

# macOSの通知センターに通知を送信
# cSpell:ignore osascript
osascript -e 'display notification "Claude Codeの処理が完了しました" with title "Claude Code" sound name "Glass"'

# 音声でも通知（オプション）
say "Claude Codeの処理が完了しました" &

# 正常終了
exit 0