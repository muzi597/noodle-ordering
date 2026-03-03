# Noodle Ordering

面馆点餐系统 MVP —— 支持扫码点餐 → 自动支付 → 厨房 KDS 实时响铃出单的完整闭环。

## 工程结构

```
apps/
  api/           NestJS API + Prisma (PostgreSQL)
  kds-web/       Vite + React 厨房显示屏
  customer-web/  Vite + React 顾客扫码点餐页
scripts/
  gen-qr-url.mjs  生成带签名的二维码 URL
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
# 按需修改 apps/api/.env，务必设置 QR_SIGNING_SECRET
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

### 7. 启动顾客点餐 Web（终端 3）

```bash
cp apps/customer-web/.env.example apps/customer-web/.env
pnpm dev:customer
# 访问 http://localhost:5174
```

## 二维码 URL 生成

### 生成签名 URL

```bash
QR_SIGNING_SECRET=mysecret node scripts/gen-qr-url.mjs \
  --shopId shop_demo \
  --tableCode A1 \
  --shopName "我的面馆"
```

输出示例：
```
Canonical string: shopId=shop_demo&tableCode=A1&shopName=我的面馆&v=1
Signature:        3a7f2c...（64位十六进制）

QR URL:
http://localhost:5174/?shopId=shop_demo&tableCode=A1&shopName=%E6%88%91%E7%9A%84%E9%9D%A2%E9%A6%86&v=1&sig=3a7f2c...
```

将该 URL 制作成二维码贴到对应桌子上即可。

### URL 参数说明

| 参数 | 说明 |
|------|------|
| shopId | 店铺 ID（对应数据库中的 Shop.id） |
| tableCode | 桌号（如 A1、B2） |
| shopName | 显示给顾客的店铺名称 |
| v | 版本号（固定为 1） |
| sig | HMAC-SHA256 签名（hex），防止参数篡改 |

签名计算规则（canonical string 精确格式）：
```
shopId=<shopId>&tableCode=<tableCode>&shopName=<shopName>&v=<v>
```
使用 `QR_SIGNING_SECRET` 对上述字符串计算 HMAC-SHA256，取 hex 编码。

## 验收流程

### 传统流程（模拟支付）

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

### 扫码点餐流程

```bash
# 生成签名 URL
QR_SIGNING_SECRET=mysecret node scripts/gen-qr-url.mjs \
  --shopId shop_demo --tableCode A1 --shopName "我的面馆"

# 用浏览器访问输出的 QR URL，或直接测试 API：
SIG=$(QR_SIGNING_SECRET=mysecret node -e "
const {createHmac}=require('crypto');
const s=createHmac('sha256','mysecret').update('shopId=shop_demo&tableCode=A1&shopName=我的面馆&v=1').digest('hex');
console.log(s);
")

curl -s -X POST http://localhost:3000/api/customer/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"shopId\": \"shop_demo\",
    \"tableCode\": \"A1\",
    \"shopName\": \"我的面馆\",
    \"v\": \"1\",
    \"sig\": \"$SIG\",
    \"items\": [{\"name\": \"招牌牛肉面\", \"qty\": 1, \"priceCents\": 2800}]
  }"
# 订单直接以 PAID 状态创建，KDS 立即收到 NEW_ORDER 事件
```

## API 文档

| Method | Path | 说明 |
|--------|------|------|
| POST | /api/orders | 创建订单 (CREATED) |
| GET | /api/orders/:id | 查询订单详情 |
| POST | /api/orders/:id/mock-paid | 模拟支付，状态 CREATED→PAID，推送 NEW_ORDER |
| POST | /api/customer/orders | 扫码点餐下单（验签 + 直接 PAID + 推送 NEW_ORDER） |
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
| QR_SIGNING_SECRET | - | QR 码签名密钥（必填，用于 HMAC-SHA256 验签） |
| VITE_API_URL (kds-web) | http://localhost:3000 | KDS 前端 API 地址 |
| VITE_WS_URL (kds-web) | http://localhost:3000 | KDS 前端 WebSocket 地址 |
| VITE_API_URL (customer-web) | http://localhost:3000 | 顾客点餐前端 API 地址 |
