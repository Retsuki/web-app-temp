#!/bin/bash

# 共通関数とユーティリティ

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 質問関数
ask_question() {
    local question=$1
    local var_name=$2
    local default=$3
    
    if [ -n "$default" ]; then
        read -p "$(echo -e ${BLUE}❓${NC} $question [$default]: )" response
        response=${response:-$default}
    else
        read -p "$(echo -e ${BLUE}❓${NC} $question: )" response
    fi
    
    eval "$var_name='$response'"
}

# Yes/No確認
confirm() {
    local question=$1
    local default=${2:-"n"}
    
    if [ "$default" = "y" ]; then
        read -p "$(echo -e ${YELLOW}⚠️ ${NC} $question [Y/n]: )" response
        response=${response:-y}
    else
        read -p "$(echo -e ${YELLOW}⚠️ ${NC} $question [y/N]: )" response
        response=${response:-n}
    fi
    
    [[ "$response" =~ ^[Yy]$ ]]
}

# コマンドの存在確認
check_command() {
    local cmd=$1
    if ! command -v $cmd &> /dev/null; then
        log_error "$cmd がインストールされていません"
        return 1
    fi
    return 0
}

# 必須コマンドのチェック
check_prerequisites() {
    local missing=0
    
    log_info "必須コマンドをチェックしています..."
    
    local commands=("gcloud" "docker" "node" "npm")
    for cmd in "${commands[@]}"; do
        if check_command $cmd; then
            log_success "$cmd ✓"
        else
            ((missing++))
        fi
    done
    
    if [ $missing -gt 0 ]; then
        log_error "必須コマンドが不足しています。インストールしてください。"
        return 1
    fi
    
    return 0
}

# プロジェクトルートの取得
get_project_root() {
    git rev-parse --show-toplevel 2>/dev/null || pwd
}

# 環境変数の読み込み
load_env() {
    local env_file="${1:-.env}"
    if [ -f "$env_file" ]; then
        export $(cat "$env_file" | grep -v '^#' | xargs)
        log_info "環境変数を読み込みました: $env_file"
    else
        log_warning "環境変数ファイルが見つかりません: $env_file"
    fi
}

# Docker イメージのタグ生成
generate_image_tag() {
    local service=$1
    local region=$2
    local project_id=$3
    local registry="$region-docker.pkg.dev"
    local repo_name="web-app-temp"
    local tag=${4:-$(git rev-parse --short HEAD 2>/dev/null || echo "latest")}
    
    echo "$registry/$project_id/$repo_name/$service:$tag"
}

# スピナー表示
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# 処理時間の計測
measure_time() {
    local start_time=$SECONDS
    "$@"
    local exit_code=$?
    local elapsed_time=$((SECONDS - start_time))
    
    if [ $exit_code -eq 0 ]; then
        log_success "完了 (${elapsed_time}秒)"
    else
        log_error "失敗 (${elapsed_time}秒)"
    fi
    
    return $exit_code
}