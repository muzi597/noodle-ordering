# Noodle Ordering

面馆点餐系统 MVP —— 支持下单 → 模拟支付 → 厨房 KDS 实时响铃出单的完整闭环。

## 工程结构

```
apps/
  api/        NestJS API + Prisma (PostgreSQL)
  kds-web/    Vite + React 厨房显示屏
docker-compose.yml   PostgreSQL 服务
.env.example         环境变量示例
```

## 快速启动

### 1. 启动 PostgreSQL

```bash
docker compose up -d
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

```bash
cp .env.example apps/api/.env
# 按需修改 apps/api/.env
```

### 4. 初始化数据库

```bash
pnpm prisma:generate   # 生成 Prisma Client
pnpm db:push           # 推送 schema 到数据库
pnpm db:seed           # 写入演示数据（shop_demo）
```

### 5. 启动 API（终端 1）

```bash
pnpm dev:api
# 监听 http://localhost:3000
```

### 6. 启动 KDS Web（终端 2）

```bash
cp apps/kds-web/.env.example apps/kds-web/.env
pnpm dev:kds
# 访问 http://localhost:5173
```

## 验收流程

```bash
# 1. 创建订单
curl -s -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "shop_demo",
    "tableCode": "A1",
    "remark": "不要辣",
    "items": [{"name": "招牌牛肉面", "qty": 1, "priceCents": 2800}]
  }' | tee /tmp/order.json

ORDER_ID=$(cat /tmp/order.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# 2. 模拟支付（KDS 页面应在 1-2 秒内响铃并出现新订单）
curl -s -X POST http://localhost:3000/api/orders/$ORDER_ID/mock-paid

# 3. 在 KDS 页面点击"完成出餐"，或通过 API 完成
curl -s -X POST http://localhost:3000/api/kds/orders/$ORDER_ID/done
```

## API 文档

| Method | Path | 说明 |
|--------|------|------|
| POST | /api/orders | 创建订单 (CREATED) |
| GET | /api/orders/:id | 查询订单详情 |
| POST | /api/orders/:id/mock-paid | 模拟支付，状态 CREATED→PAID，推送 NEW_ORDER |
| GET | /api/kds/orders?shopId= | 厨房拉取 PAID 订单 |
| POST | /api/kds/orders/:id/done | 完成订单，PAID→DONE |

## WebSocket

- 命名空间: `/kds`
- 客户端加入房间: `emit('join', { shopId })`
- 服务端推送: `NEW_ORDER` 事件（payload: 完整 order 对象）

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| DATABASE_URL | - | PostgreSQL 连接串 |
| PORT | 3000 | API 端口 |
| CORS_ORIGIN | * | 允许的前端 Origin |
| VITE_API_URL | http://localhost:3000 | KDS 前端 API 地址 |
| VITE_WS_URL | http://localhost:3000 | KDS 前端 WebSocket 地址 |
