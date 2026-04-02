#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 默认使用脚本所在目录（即仓库根目录）。若代码在 /opt/design-compare，可: PROJECT_DIR=/opt/design-compare ./deploy.sh
PROJECT_DIR="${PROJECT_DIR:-$SCRIPT_DIR}"

DOMAIN="onemarket.xin"
REPO_URL=""  # 填入你的 Git 仓库地址

# 无域名、仅用 IP:端口（如 http://公网IP:9000）时保持为 1；已取消 compose 中 nginx/certbot 注释并要申请证书时改为 0。
SKIP_SSL="${SKIP_SSL:-1}"

echo "=============================="
echo "  Design Compare 部署脚本"
echo "  域名: $DOMAIN"
echo "  项目目录: $PROJECT_DIR"
echo "=============================="

require_compose_file() {
    if [ ! -f "$PROJECT_DIR/docker-compose.yml" ]; then
        echo ""
        echo "错误: 在 $PROJECT_DIR 下找不到 docker-compose.yml。"
        echo "  - 请在仓库根目录执行本脚本，或设置: export PROJECT_DIR=/你的/项目路径"
        echo "  - 若使用 /opt/design-compare，请先把完整项目（含 docker-compose.yml）拷到该目录或 git clone。"
        exit 1
    fi
}

# ---- 1. 系统依赖 ----
install_deps() {
    echo "[1/6] 安装系统依赖..."
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com | sh
        systemctl enable docker
        systemctl start docker
    fi
    if ! docker compose version &> /dev/null; then
        apt-get update && apt-get install -y docker-compose-plugin
    fi
    echo "  ✓ Docker $(docker --version | awk '{print $3}')"
}

# ---- 2. 项目目录 ----
setup_project() {
    echo "[2/6] 准备项目目录..."
    mkdir -p "$PROJECT_DIR"
    if [ -n "$REPO_URL" ]; then
        if [ -d "$PROJECT_DIR/.git" ]; then
            (cd "$PROJECT_DIR" && git pull)
        else
            git clone "$REPO_URL" "$PROJECT_DIR"
        fi
    else
        echo "  ⚠ 未设置 REPO_URL 时，请确保 $PROJECT_DIR 已是完整仓库（含 docker-compose.yml）"
    fi
    cd "$PROJECT_DIR"
    require_compose_file
}

# ---- 3. 环境变量 ----
setup_env() {
    echo "[3/6] 检查环境变量..."
    if [ ! -f .env.production ]; then
        cat > .env.production << 'EOF'
# 在这里填写生产环境变量
# MINIMAX_API_KEY=your_key_here
# FEISHU_CHAT_ID=your_chat_id_here
EOF
        echo "  ⚠ 已创建 .env.production 模板，请编辑填入真实值"
        echo "  vim $PROJECT_DIR/.env.production"
    else
        echo "  ✓ .env.production 已存在"
    fi
}

# ---- 4. SSL 证书 ----
setup_ssl() {
    echo "[4/6] 配置 SSL 证书..."
    require_compose_file

    if [ "$SKIP_SSL" = "1" ] || [ "$SKIP_SSL" = "true" ]; then
        echo "  已跳过（SKIP_SSL=1，无域名阶段用 http://<服务器IP>:9000；需要 HTTPS 时取消 compose 中 nginx/certbot 并设 SKIP_SSL=0）"
        return 0
    fi

    mkdir -p nginx/conf.d nginx/ssl nginx/certbot/www

    if [ ! -d "nginx/ssl/live/$DOMAIN" ]; then
        echo "  首次申请证书，先用 HTTP 模式启动 Nginx..."

        # 临时 nginx 配置（仅 HTTP，用于证书验证）
        cat > nginx/conf.d/default.conf.tmp << TMPEOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Setting up SSL...';
        add_header Content-Type text/plain;
    }
}
TMPEOF
        if [ -f nginx/conf.d/default.conf ]; then
            cp nginx/conf.d/default.conf nginx/conf.d/default.conf.bak
        fi
        mv nginx/conf.d/default.conf.tmp nginx/conf.d/default.conf

        docker compose up -d nginx

        echo "  申请 Let's Encrypt 证书..."
        docker compose run --rm certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            -d "$DOMAIN" \
            -d "www.$DOMAIN" \
            --email "admin@$DOMAIN" \
            --agree-tos \
            --no-eff-email

        # 恢复完整 nginx 配置（有备份时才恢复）
        if [ -f nginx/conf.d/default.conf.bak ]; then
            mv nginx/conf.d/default.conf.bak nginx/conf.d/default.conf
        else
            echo "  ⚠ 未找到 default.conf 备份，请从仓库复制 nginx/conf.d/default.conf 后再启动"
        fi
        docker compose down
        echo "  ✓ SSL 证书申请成功"
    else
        echo "  ✓ SSL 证书已存在"
    fi
}

# ---- 5. 构建并启动 ----
build_and_start() {
    echo "[5/6] 构建 Docker 镜像并启动服务..."
    require_compose_file
    docker compose build --no-cache app
    docker compose up -d
    echo "  ✓ 服务已启动"
}

# ---- 6. 验证 ----
verify() {
    echo "[6/6] 验证部署..."
    sleep 5
    if curl -sf -o /dev/null "http://localhost:9000"; then
        echo "  ✓ 应用运行正常 (localhost:9000)"
    else
        echo "  ✗ 应用可能未正常启动，查看日志:"
        echo "    docker compose logs app"
    fi

    echo ""
    echo "=============================="
    echo "  部署完成！"
    if [ "$SKIP_SSL" = "1" ] || [ "$SKIP_SSL" = "true" ]; then
        echo "  访问: http://<本机公网IP>:9000（安全组放行 9000）"
    else
        echo "  https://$DOMAIN"
    fi
    echo "=============================="
    echo ""
    echo "常用命令："
    echo "  查看日志:    docker compose logs -f"
    echo "  重启服务:    docker compose restart"
    echo "  更新部署:    git pull && docker compose up -d --build"
    if [ "$SKIP_SSL" != "1" ] && [ "$SKIP_SSL" != "true" ]; then
        echo "  续期证书:    docker compose run --rm certbot renew"
    fi
}

# ---- 执行 ----
install_deps
setup_project
setup_env
setup_ssl
build_and_start
verify
