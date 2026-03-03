import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  priceCents: number;
}

interface Order {
  id: string;
  shopId: string;
  tableCode: string;
  remark?: string;
  status: string;
  items: OrderItem[];
  createdAt: string;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
}

function OrderCard({ order, onDone }: { order: Order; onDone: (id: string) => void }) {
  const time = new Date(order.createdAt).toLocaleTimeString();
  const total = order.items.reduce((s, i) => s + i.priceCents * i.qty, 0);

  return (
    <div className="order-card">
      <h2>桌 {order.tableCode}</h2>
      <div className="meta">
        #{order.id.slice(-6)} · {time}
      </div>
      <ul>
        {order.items.map((item) => (
          <li key={item.id}>
            {item.name} × {item.qty}
            <span style={{ float: 'right' }}>¥{(item.priceCents / 100).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="meta" style={{ marginBottom: 8 }}>
        合计: ¥{(total / 100).toFixed(2)}
      </div>
      {order.remark && <div className="remark">备注: {order.remark}</div>}
      <button className="btn-done" onClick={() => onDone(order.id)}>
        ✓ 完成出餐
      </button>
    </div>
  );
}

export default function App() {
  const [shopId, setShopId] = useState('shop_demo');
  const [inputShopId, setInputShopId] = useState('shop_demo');
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchOrders = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/kds/orders?shopId=${sid}`);
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error('Failed to fetch orders', e);
    }
  }, []);

  const handleDone = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/kds/orders/${id}/done`, { method: 'POST' });
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      console.error('Failed to mark done', e);
    }
  };

  useEffect(() => {
    fetchOrders(shopId);

    const socket = io(`${WS_URL}/kds`, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', { shopId });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('NEW_ORDER', (order: Order) => {
      playBeep();
      setOrders((prev) => {
        if (prev.find((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [shopId, fetchOrders]);

  const handleJoin = () => {
    setShopId(inputShopId);
  };

  return (
    <>
      <h1>
        厨房出单系统 (KDS)
        <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} title={connected ? '已连接' : '未连接'} />
      </h1>
      <div className="config-bar">
        <label>店铺 ID:</label>
        <input
          value={inputShopId}
          onChange={(e) => setInputShopId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />
        <button onClick={handleJoin}>加入</button>
        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>当前: {shopId}</span>
      </div>
      {orders.length === 0 ? (
        <div className="empty">暂无待制作订单</div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onDone={handleDone} />
          ))}
        </div>
      )}
    </>
  );
}
