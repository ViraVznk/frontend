import { useEffect, useState } from "react";
import { CheckRow, EmployeeDropdown, thStyle, tdStyle, btnStyle } from "./Checkshared";

function monthAgo() {
  const d = new Date(); d.setMonth(d.getMonth() - 1); d.setHours(0, 0, 0, 0); return d;
}

function DateInput({ label, value, onChange }) {
  const toVal = (d) => d ? d.toISOString().slice(0, 10) : "";
  const fromVal = (s) => { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 0, 0, 0); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontSize: 11, color: "#888", fontWeight: 500, letterSpacing: "0.04em" }}>{label}</label>
      <input type="date" value={toVal(value)} onChange={e => onChange(fromVal(e.target.value))}
        style={{ border: "none", borderBottom: "1.5px solid #ccc", outline: "none", fontSize: 13, padding: "4px 2px", background: "transparent", cursor: "pointer", color: "#333" }} />
    </div>
  );
}

function ProductQuantityPanel({ from, to }) {
  const [products, setProducts] = useState([]);
  const [selectedUpc, setSelectedUpc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/store-products")
      .then(r => r.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  const search = () => {
    if (!selectedUpc || !from || !to) return;
    setLoading(true);
    const toEnd = new Date(to); toEnd.setHours(23, 59, 59);
    const f = from.toISOString();
    const t = toEnd.toISOString();
    fetch(`/api/sales/quantity?upc=${selectedUpc}&from=${f}&to=${t}`)
      .then(r => r.ok ? r.json() : null)
      .then(qty => { setResult(qty); setLoading(false); })
      .catch(() => { setResult(null); setLoading(false); });
  };

  const selectedProduct = products.find(p => p.upc === selectedUpc);

  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 11, color: "#888", fontWeight: 500, letterSpacing: "0.04em", marginBottom: 8 }}>
        КІЛЬКІСТЬ ПРОДАНОГО ТОВАРУ ЗА ПЕРІОД
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>ТОВАР</label>
          <select
            value={selectedUpc}
            onChange={e => { setSelectedUpc(e.target.value); setResult(null); }}
            style={{
              fontSize: 13, border: "none", borderBottom: "1.5px solid #ccc",
              outline: "none", background: "transparent", padding: "4px 2px",
              minWidth: 240, cursor: "pointer", color: selectedUpc ? "#333" : "#aaa",
            }}
          >
            <option value="">— оберіть товар —</option>
            {products.map(p => (
              <option key={p.upc} value={p.upc}>{p.PRODUCT_NAME ?? p.upc}</option>
            ))}
          </select>
        </div>

        <button onClick={search} disabled={!selectedUpc || loading} style={btnStyle("#666f76")}>
          {loading ? "…" : "Порахувати"}
        </button>

        {result !== null && (
          <div sstyle={{ fontSize: 13, color: "#555", marginBottom: 10 }}>
            <strong>
              {selectedProduct?.PRODUCT_NAME ?? selectedUpc}: 
            </strong>
            <span style={{ fontSize: 18, fontWeight: 600, color: "#222" }}>{result}  од.</span>
          </div>
        )}
      </div>
    </div>
  );
}

const COLUMNS = [
  { key: "check_number", label: "Номер чеку" },
  { key: "id_employee",  label: "Касир" },
  { key: "card_number",  label: "Картка" },
  { key: "print_date",   label: "Дата" },
  { key: "sum_total",    label: "Сума (₴)" },
  { key: "vat",          label: "ПДВ (₴)" },
];

export default function ManagerChecksView() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [from, setFrom]         = useState(monthAgo());
  const [to, setTo]             = useState(new Date());
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [totalSum, setTotalSum] = useState(null);

  const load = () => {
    if (!from || !to) return;
    setLoading(true);
    const toEnd = new Date(to); toEnd.setHours(23, 59, 59);
    const f = from.toISOString();
    const t = toEnd.toISOString();

    const checksUrl = selectedEmployee
      ? `/api/checks/employee/${selectedEmployee}?from=${f}&to=${t}`
      : `/api/checks?from=${f}&to=${t}`;
    const sumUrl = selectedEmployee
      ? `/api/checks/sum/employee/${selectedEmployee}?from=${f}&to=${t}`
      : `/api/checks/sum?from=${f}&to=${t}`;

    Promise.all([
      fetch(checksUrl).then(r => r.ok ? r.json() : []),
      fetch(sumUrl).then(r => r.ok ? r.json() : 0),
    ])
      .then(([checks, sum]) => { setData(Array.isArray(checks) ? checks : []); setTotalSum(sum); setLoading(false); })
      .catch(() => { setData([]); setTotalSum(0); setLoading(false); });
  };

  useEffect(() => { load(); }, [selectedEmployee]);

  const handleDelete = (row) => {
    fetch(`/api/checks/${row.check_number}`, { method: "DELETE" })
      .then(r => { if (!r.ok) return r.text().then(msg => alert(msg)); load(); });
  };

  const totalLabel = selectedEmployee ? "СУМА КАСИРА ЗА ПЕРІОД " : "ЗАГАЛЬНА СУМА ЗА ПЕРІОД ";

  return (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ width: 140 }}>
        <DateInput label="З" value={from} onChange={setFrom} />
      </div>
      <div style={{ width: 140 }}>
        <DateInput label="По" value={to} onChange={setTo} />
      </div>
    </div>

    <ProductQuantityPanel from={from} to={to} />

    <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
      <EmployeeDropdown value={selectedEmployee} onChange={setSelectedEmployee} />

      <button onClick={load} style={btnStyle("#666f76")}>Шукати</button>

      <button
        onClick={() => { setSelectedEmployee(null); setFrom(monthAgo()); setTo(new Date()); }}
        style={{
          padding: "4px 10px",
          borderRadius: 6,
          border: "0.5px solid #ccc",
          background: "transparent",
          cursor: "pointer",
          fontSize: 13,
          color: "#666",
        }}
      >
        ↺ Відновити
      </button>

      {totalSum !== null && (
        <div style= {{ fontSize: 13, color: "#555", marginBottom: 10 }}>
          <strong>{totalLabel}
            {parseFloat(totalSum).toLocaleString("uk-UA", { minimumFractionDigits: 2 })}₴
          </strong>
        </div>
      )}
    </div>

      {/* Table */}
      <div id="checks-print-area" style={{ overflow: "auto", maxHeight: "60vh", border: "0.5px solid #ddd", borderRadius: 12 }}>
        <table style={{ width: "max-content", minWidth: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f5f5f5" }}>
            <tr>
              {COLUMNS.map(col => <th key={col.key} style={thStyle}>{col.label}</th>)}
              <th style={{ ...thStyle, width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLUMNS.length + 1} style={{ padding: 20, textAlign: "center", color: "#aaa" }}>Завантаження…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={COLUMNS.length + 1} style={{ padding: 20, textAlign: "center", color: "#bbb" }}>Чеків не знайдено</td></tr>
            ) : data.map((row, i) => (
              <CheckRow key={row.check_number + i} check={row} columns={COLUMNS} onDelete={handleDelete} canDelete={true} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}