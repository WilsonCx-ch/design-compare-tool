#!/bin/bash
set -e

DOMAIN="onemarket.xin"
PROJECT_DIR="/opt/design-compare"
REPO_URL=""  # 填入你的 Git 仓库地址

echo "=============================="
echo "  Design Compare 部署脚本"
echo "  域名: $DOMAIN"
echo "=============================="

# ---- 1. 系统依赖 ----
install_deps() {
    echo "[1/6] 安装系统依赖..."
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com | sh
        systemctl enable docker
        systemctl start docker
    fi
    if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
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
            cd "$PROJECT_DIR" && git pull
        else
            git clone "$REPO_URL" "$PROJECT_DIR"
        fi
    else
        echo "  ⚠ 未设置 REPO_URL，请手动上传代码到 $PROJECT_DIR"
        echo "  可用: scp -r ./* root@<服务器IP>:$PROJECT_DIR/"
    fi
    cd "$PROJECT_DIR"
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
    mkdir -p nginx/ssl nginx/certbot/www

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
        cp nginx/conf.d/default.conf nginx/conf.d/default.conf.bak
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

        # 恢复完整 nginx 配置
        mv nginx/conf.d/default.conf.bak nginx/conf.d/default.conf
        docker compose down
        echo "  ✓ SSL 证书申请成功"
    else
        echo "  ✓ SSL 证书已存在"
    fi
}

# ---- 5. 构建并启动 ----
build_and_start() {
    echo "[5/6] 构建 Docker 镜像并启动服务..."
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
    echo "  https://$DOMAIN"
    echo "=============================="
    echo ""
    echo "常用命令："
    echo "  查看日志:    docker compose logs -f"
    echo "  重启服务:    docker compose restart"
    echo "  更新部署:    git pull && docker compose up -d --build"
    echo "  续期证书:    docker compose run --rm certbot renew"
}

# ---- 执行 ----
install_deps
setup_project
setup_env
setup_ssl
build_and_start
verify
