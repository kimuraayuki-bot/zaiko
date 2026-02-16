import { useEffect, useMemo, useState } from 'react';

async function callGas(method, params) {
  const res = await fetch('/api/gas', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ method, params })
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'API error');
  return json.data;
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [data, setData] = useState({ materials: [], items: [], masterAll: [] });
  const [tab, setTab] = useState('stock');

  const [inName, setInName] = useState('');
  const [inQty, setInQty] = useState('');
  const [inUnit, setInUnit] = useState('');

  const [outName, setOutName] = useState('');
  const [outQty, setOutQty] = useState('');
  const [outUnit, setOutUnit] = useState('');

  const loadInitial = async () => {
    setLoading(true);
    try {
      const d = await callGas('getInitialData');
      setData(d || { materials: [], items: [], masterAll: [] });
      const all = (d?.masterAll || []);
      if (all.length > 0) {
        const first = all[0];
        setInName((v) => v || first.name);
        setOutName((v) => v || first.name);
      }
      setMessage('接続OK');
    } catch (err) {
      setMessage(`接続エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const inMaster = useMemo(
    () => (data.masterAll || []).find((x) => x.name === inName),
    [data.masterAll, inName]
  );
  const outMaster = useMemo(
    () => (data.masterAll || []).find((x) => x.name === outName),
    [data.masterAll, outName]
  );

  const inUnits = useMemo(() => {
    if (!inMaster) return [];
    return (inMaster.unitOptions && inMaster.unitOptions.length > 0) ? inMaster.unitOptions : [inMaster.unit];
  }, [inMaster]);
  const outUnits = useMemo(() => {
    if (!outMaster) return [];
    return (outMaster.unitOptions && outMaster.unitOptions.length > 0) ? outMaster.unitOptions : [outMaster.unit];
  }, [outMaster]);

  useEffect(() => {
    if (inUnits.length > 0) setInUnit(inUnits[0]);
  }, [inName, inUnits.length]);
  useEffect(() => {
    if (outUnits.length > 0) setOutUnit(outUnits[0]);
  }, [outName, outUnits.length]);

  const quickIn = async () => {
    const qty = Number(inQty || 0);
    if (!inName || qty <= 0 || !inUnit) return;
    setLoading(true);
    try {
      const msg = await callGas('processInflowFromUI', {
        name: inName,
        qty: qty,
        inputUnit: inUnit,
        memo: 'React入庫',
        isSet: false
      });
      setMessage(msg || '入庫登録しました');
      setInQty('');
      await loadInitial();
    } catch (err) {
      setMessage(`入庫エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const quickOut = async () => {
    const qty = Number(outQty || 0);
    if (!outMaster || qty <= 0 || !outUnit) return;
    setLoading(true);
    try {
      const msg = await callGas('processInventoryAdjustment', [
        outMaster.name,
        qty,
        'waste',
        outMaster.category,
        outMaster.unit,
        outUnit
      ]);
      setMessage(msg || '出庫登録しました');
      setOutQty('');
      await loadInitial();
    } catch (err) {
      setMessage(`出庫エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStockCards = (list) => (list || []).map((r) => (
    <div className="card" key={r.name}>
      <div style={{ fontWeight: 800 }}>{r.name}</div>
      <div style={{ marginTop: 6, color: '#0f609b', fontWeight: 700 }}>
        {r.currentQty} {r.unit}
      </div>
      <div className="note">閾値: {r.threshold} {r.thresholdUnit || r.unit}</div>
    </div>
  ));

  return (
    <div className="page">
      <header>
        <div className="row">
          <button type="button" onClick={() => setTab('stock')}>在庫</button>
          <button type="button" onClick={() => setTab('in')}>入庫</button>
          <button type="button" onClick={() => setTab('out')}>出庫</button>
          <button type="button" onClick={loadInitial}>更新</button>
        </div>
        <div className="note">{loading ? '処理中...' : message}</div>
      </header>

      <main style={{ padding: 12 }}>
        {tab === 'stock' && (
          <>
            <h3>材料</h3>
            {renderStockCards(data.materials)}
            <h3>物品</h3>
            {renderStockCards(data.items)}
          </>
        )}

        {tab === 'in' && (
          <div className="card">
            <h3>入庫</h3>
            <label>アイテム</label>
            <select value={inName} onChange={(e) => setInName(e.target.value)}>
              {(data.masterAll || []).map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
            <label>数量</label>
            <input type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} />
            <label>入力単位</label>
            <select value={inUnit} onChange={(e) => setInUnit(e.target.value)}>
              {inUnits.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <button type="button" onClick={quickIn}>入庫登録</button>
          </div>
        )}

        {tab === 'out' && (
          <div className="card">
            <h3>出庫</h3>
            <label>アイテム</label>
            <select value={outName} onChange={(e) => setOutName(e.target.value)}>
              {(data.masterAll || []).map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
            <label>数量</label>
            <input type="number" value={outQty} onChange={(e) => setOutQty(e.target.value)} />
            <label>入力単位</label>
            <select value={outUnit} onChange={(e) => setOutUnit(e.target.value)}>
              {outUnits.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <button type="button" onClick={quickOut}>出庫登録</button>
          </div>
        )}
      </main>
    </div>
  );
}
