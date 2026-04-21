import { useEffect, useState } from "react";
import { CheckRow, SalesPanel, CheckNumberDropdown, StoreProductDropdown, thStyle, tdStyle, btnStyle } from "./Checkshared";

function todayRange() {
  const now = new Date();
  return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0), to: now };
}

function toISO(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function DateTimeInput({ label, value, onChange }) {
  const toInputVal = (d) => {
    if (!d) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const handleChange = (e) => {
    const raw = e.target.value;
    if (!raw) { onChange(null); return; }
    const [datePart, timePart] = raw.split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    const [h, min] = (timePart || "00:00").split(":").map(Number);
    onChange(new Date(y, m - 1, d, h, min, 0));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontSize: 11, color: "#888", fontWeight: 500, letterSpacing: "0.04em" }}>{label}</label>
      <input type="datetime-local" value={toInputVal(value)} onChange={handleChange}
        style={{ border: "none", borderBottom: "1.5px solid #de97c0", outline: "none", fontSize: 13, padding: "4px 2px", background: "transparent", cursor: "pointer", color: "#333" }} />
    </div>
  );
}

const TABS = [
  { key: "today", label: "Сьогодні" },
  { key: "period", label: "За період" },
  { key: "search", label: "Пошук за чеком" },
  { key: "add", label: "+ Новий чек" },
];

function ModeTabs({ mode, setMode, canAdd }) {
  const tabs = canAdd ? TABS : TABS.filter(t => t.key !== "add");
  return (
    <div style={{ display: "flex", background: "#fbddee", borderRadius: 8, padding: 3, gap: 2, flexWrap: "wrap", marginBottom: 16 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => setMode(t.key)} style={{
          padding: "5px 14px", borderRadius: 6, border: "none",
          background: mode === t.key ? "#fff" : "transparent",
          fontWeight: mode === t.key ? 600 : 400,
          fontSize: 13, cursor: "pointer",
          color: mode === t.key ? "#333" : "#666",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

function CheckSearchPanel({ employeeId }) {
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = (num) => {
    if (!num) return;
    setLoading(true);
    setResult(null);
    fetch(`/api/checks/${num}`)
      .then(r => { if (r.status === 404) { setResult({ notFound: true }); setLoading(false); return null; } return r.json(); })
      .then(check => { if (check) { setResult({ check }); setLoading(false); } })
      .catch(() => { setResult({ notFound: true }); setLoading(false); });
  };

  const handleSelect = (num) => { setSelected(num); setResult(null); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, color: "#313131", fontWeight: 500, letterSpacing: "0.04em" }}>НОМЕР ЧЕКУ</label>
          <CheckNumberDropdown value={selected} onChange={handleSelect} employeeId={employeeId} />
        </div>
        <button onClick={() => search(selected)} disabled={!selected} style={btnStyle("#e6b1d2")}>Знайти</button>
        {result && (
          <button onClick={() => { setResult(null); setSelected(""); }} style={btnStyle("#e6b1d2")}>✕</button>
        )}
      </div>

      {loading && <div style={{ fontSize: 13, color: "#aaa" }}>Завантаження…</div>}
      {result?.notFound && <div style={{ fontSize: 13, color: "#e53935" }}>Чек не знайдено</div>}

      {result?.check && (
        <div style={{ border: "0.5px solid #de97c0", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "#fbddee", display: "flex", flexWrap: "wrap", gap: 20 }}>
            {[
              ["Номер", result.check.check_number],
              ["Касир", result.check.id_employee],
              ["Картка", result.check.card_number ?? "—"],
              ["Дата", result.check.print_date ? new Date(result.check.print_date).toLocaleString("uk-UA") : "—"],
              ["Сума", `${parseFloat(result.check.sum_total ?? 0).toFixed(2)} ₴`],
              ["ПДВ", `${parseFloat(result.check.vat ?? 0).toFixed(2)} ₴`],
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, color: "#7f7e7e", fontWeight: 500 }}>{lbl}</span>
                <span style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </div>
          <SalesPanel checkNumber={result.check.check_number} />
        </div>
      )}
    </div>
  );
}

function AddCheckPanel({ employeeId, onAdded }) {
  const [storeProducts, setStoreProducts] = useState([]);
  const [checkNumber, setCheckNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [items, setItems] = useState([{ upc: "", qty: 1 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/store-products/all-with-det")
      .then(r => r.json())
      .then(setStoreProducts)
      .catch(console.error);
  }, []);

  const addItem = () => setItems(p => [...p, { upc: "", qty: 1 }]);
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const handleSubmit = async () => {
    if (!checkNumber.trim() || items.some(it => !it.upc)) {
      alert("Заповніть номер чеку та всі товари");
      return;
    }
    setSaving(true);
    try {
      let sumTotal = 0;
      const salesPayload = items.map(it => {
        const sp = storeProducts.find(p => (p.UPC ?? p.upc) === it.upc);
        const price = parseFloat(sp?.SELLING_PRICE ?? sp?.selling_price ?? 0);
        sumTotal += price * it.qty;
        return { upc: it.upc, product_number: it.qty, selling_price: price, check_number: checkNumber };
      });

      const checkRes = await fetch("/api/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          check_number: checkNumber,
          id_employee: employeeId,
          card_number: cardNumber || null,
          print_date: new Date().toISOString(),
          sum_total: sumTotal,
          vat: +(sumTotal * 0.2).toFixed(2),
        }),
      });
      if (!checkRes.ok) { alert(await checkRes.text()); setSaving(false); return; }

      for (const sale of salesPayload) {
        await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sale),
        });
      }

      setCheckNumber(""); setCardNumber(""); setItems([{ upc: "", qty: 1 }]);
      onAdded();
    } catch {
      alert("Помилка при збереженні");
    }
    setSaving(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>НОМЕР ЧЕКУ</label>
          <input value={checkNumber} onChange={e => setCheckNumber(e.target.value)}
            placeholder="CHK0000001" style={addInputStyle} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>КАРТКА КЛІЄНТА</label>
          <input value={cardNumber} onChange={e => setCardNumber(e.target.value)}
            placeholder="необов'язково" style={addInputStyle} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: "#888", fontWeight: 500, marginBottom: 8 }}>ТОВАРИ</div>
        <div style={{ border: "0.5px solid #de97c0", borderRadius: 8, overflow: "visible" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: "#fbddee" }}>
              <tr>
                <th style={{ ...thStyle, fontSize: 12 }}>Товар</th>
                <th style={{ ...thStyle, fontSize: 12, width: 90 }}>К-сть</th>
                <th style={{ ...thStyle, width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, overflow: "visible" }}>
                    <StoreProductDropdown
                      value={it.upc}
                      onChange={v => updateItem(i, "upc", v)}
                      products={storeProducts}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input type="number" min={1} value={it.qty}
                      onChange={e => updateItem(i, "qty", parseInt(e.target.value) || 1)}
                      style={{ ...addInputStyle, width: 70 }} />
                  </td>
                  <td style={tdStyle}>
                    {items.length > 1 && (
                  <button onClick={() => removeItem(i)} style={{background: "none", border: "none", cursor: "pointer",fontSize: 16, color: "#e53935", padding: "2px 6px",
                        }}>✕</button>                    
                        )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addItem} style={{ ...btnStyle("#e6b1d2"), marginTop: 8, fontSize: 12 }}>+ Додати товар</button>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSubmit} disabled={saving} style={btnStyle("#e6b1d2")}>
          {saving ? "Збереження…" : "✓ Зберегти"}
        </button>
      </div>
    </div>
  );
}

const COLUMNS = [
  { key: "check_number", label: "Номер чеку" },
  { key: "id_employee", label: "Касир" },
  { key: "card_number", label: "Картка" },
  { key: "print_date", label: "Дата" },
  { key: "sum_total", label: "Сума (₴)" },
  { key: "vat", label: "ПДВ (₴)" },
];

export default function ChecksView({ employeeId, canDelete = true, canAdd = false }) {
  const [mode, setMode] = useState("today");
  const [from, setFrom] = useState(todayRange().from);
  const [to, setTo] = useState(todayRange().to);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalSum, setTotalSum] = useState(null);

  const isTableMode = mode === "today" || mode === "period";

  const load = () => {
    if (!isTableMode) return;
    setLoading(true);
    const f = toISO(from);
    const t = toISO(to);
    const url = mode === "today"
      ? `/api/checks/employee/${employeeId}/day?day=${f}`
      : `/api/checks/employee/${employeeId}?from=${f}&to=${t}`;

    fetch(url)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setData([]); setLoading(false); });

    if (mode === "period") {
      fetch(`/api/checks/sum/employee/${employeeId}?from=${f}&to=${t}`)
        .then(r => r.ok ? r.json() : null)
        .then(setTotalSum)
        .catch(() => setTotalSum(null));
    } else {
      setTotalSum(null);
    }
  };

  useEffect(() => { load(); }, [mode]);

  const handleDelete = (row) => {
    fetch(`/api/checks/${row.check_number}`, { method: "DELETE" })
      .then(r => { if (!r.ok) return r.text().then(msg => alert(msg)); load(); });
  };

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <style>{`@media print { body * { visibility: hidden !important; } #checks-print-area, #checks-print-area * { visibility: visible !important; } #checks-print-area { position: fixed; top: 0; left: 0; width: 100%; } .no-print { display: none !important; } }`}</style>

      <ModeTabs mode={mode} setMode={setMode} canAdd={canAdd} />

      {mode === "period" && (
        <div className="no-print" style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
          <DateTimeInput label="Від" value={from} onChange={v => v && setFrom(v)} />
          <DateTimeInput label="До" value={to} onChange={v => v && setTo(v)} />
          <button onClick={load} style={btnStyle("#e6b1d2")}>Застосувати</button>
        </div>
      )}

      {isTableMode && totalSum !== null && (
        <div style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>
          <strong>Загальна сума за період: {parseFloat(totalSum).toFixed(2)} ₴</strong>
        </div>
      )}

      {mode === "search" && <CheckSearchPanel employeeId={employeeId} />}

      {mode === "add" && (
        <AddCheckPanel
          employeeId={employeeId}
          onAdded={() => { setMode("today"); load(); }}
        />
      )}

      {isTableMode && (
        <div id="checks-print-area" style={{ overflow: "auto", maxHeight: "65vh", border: "0.5px solid #de97c0", borderRadius: 12 }}>
          <table style={{ width: "max-content", minWidth: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#fbddee" }}>
              <tr>
                {COLUMNS.map(col => <th key={col.key} style={thStyle}>{col.label}</th>)}
                {canDelete && <th style={{ ...thStyle, width: 50 }}></th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={COLUMNS.length + 1} style={{ padding: 20, textAlign: "center", color: "#aaa" }}>Завантаження…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={COLUMNS.length + 1} style={{ padding: 20, textAlign: "center", color: "#bbb" }}>Чеків не знайдено</td></tr>
              ) : data.map((row, i) => (
                <CheckRow key={row.check_number + i} check={row} columns={COLUMNS} onDelete={handleDelete} canDelete={canDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const addInputStyle = {
  border: "none", outline: "none", fontSize: 13,
  background: "transparent", borderBottom: "1px solid #ccc",
  padding: "2px 0", minWidth: 160,
};