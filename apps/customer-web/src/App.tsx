import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface MenuItem {
  name: string;
  priceCents: number;
}

const MENU_ITEMS: MenuItem[] = [
  { name: '招牌牛肉面', priceCents: 2800 },
  { name: '番茄鸡蛋面', priceCents: 2200 },
  { name: '红烧排骨面', priceCents: 3200 },
  { name: '素浇面', priceCents: 1800 },
  { name: '葱油拌面', priceCents: 1600 },
];

interface QrParams {
  shopId: string;
  tableCode: string;
  shopName: string;
  v: string;
  sig: string;
}

function parseQrParams(): QrParams | null {
  const p = new URLSearchParams(window.location.search);
  const shopId = p.get('shopId');
  const tableCode = p.get('tableCode');
  const shopName = p.get('shopName');
  const v = p.get('v');
  const sig = p.get('sig');
  if (!shopId || !tableCode || !shopName || !v || !sig) return null;
  return { shopId, tableCode, shopName, v, sig };
}

export default function App() {
  const qr = parseQrParams();
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(MENU_ITEMS.map((item) => [item.name, 0])),
  );
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!qr) {
    return (
      <div className="error-box">
        <p>⚠️ 无效的点餐链接，请重新扫描桌上的二维码。</p>
      </div>
    );
  }

  const adjust = (name: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [name]: Math.max(0, (prev[name] ?? 0) + delta),
    }));
  };

  const totalCents = MENU_ITEMS.reduce(
    (sum, item) => sum + item.priceCents * (quantities[item.name] ?? 0),
    0,
  );

  const hasItems = Object.values(quantities).some((q) => q > 0);

  const handleSubmit = async () => {
    if (!hasItems) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const items = MENU_ITEMS.filter((item) => quantities[item.name] > 0).map(
        (item) => ({
          name: item.name,
          qty: quantities[item.name],
          priceCents: item.priceCents,
        }),
      );
      const res = await fetch(`${API_BASE}/api/customer/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: qr.shopId,
          tableCode: qr.tableCode,
          shopName: qr.shopName,
          v: qr.v,
          sig: qr.sig,
          remark: remark ? remark : undefined,
          items,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `请求失败 (${res.status})`);
      }
      const order = await res.json();
      setOrderId(order.id);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderId) {
    return (
      <div className="success-box">
        <div className="check">✅</div>
        <h2>下单成功！</h2>
        <p>您的餐点正在制作中，请稍候。</p>
        <p className="order-id">订单号: {orderId}</p>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <h1>{qr.shopName}</h1>
        <div className="table-info">桌号：{qr.tableCode}</div>
      </div>

      <div className="menu">
        <h2>请选择菜品</h2>
        {MENU_ITEMS.map((item) => (
          <div key={item.name} className="menu-item">
            <div className="menu-item-info">
              <div className="menu-item-name">{item.name}</div>
              <div className="menu-item-price">¥{(item.priceCents / 100).toFixed(2)}</div>
            </div>
            <div className="qty-control">
              <button onClick={() => adjust(item.name, -1)}>−</button>
              <span>{quantities[item.name] ?? 0}</span>
              <button onClick={() => adjust(item.name, 1)}>＋</button>
            </div>
          </div>
        ))}
      </div>

      <div className="remark-section">
        <textarea
          placeholder="备注（口味要求、过敏原等，可选）"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
      </div>

      <div className="submit-section">
        <div className="total">
          合计：<strong>¥{(totalCents / 100).toFixed(2)}</strong>
        </div>
        {errorMsg && <p style={{ color: '#e94560', marginBottom: 10, fontSize: '0.9rem' }}>{errorMsg}</p>}
        <button
          className="btn-submit"
          disabled={!hasItems || submitting}
          onClick={handleSubmit}
        >
          {submitting ? '提交中…' : '确认下单'}
        </button>
      </div>
    </>
  );
}
