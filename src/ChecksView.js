import { useEffect, useState } from "react";
import { CheckRow, thStyle, tdStyle } from "./Checkshared";

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
      <input
        type="datetime-local"
        value={toInputVal(value)}
        onChange={handleChange}
        style={{
          border: "none", borderBottom: "1.5px solid #ccc", outline: "none",
          fontSize: 13, padding: "4px 2px", background: "transparent",
          cursor: "pointer", color: "#333",
        }}
      />
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

export default function ChecksView({ employeeId, canDelete = true, canAdd = false }) {
  const [mode, setMode]         = useState("today");
  const [from, setFrom]         = useState(todayRange().from);
  const [to, setTo]             = useState(todayRange().to);
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [totalSum, setTotalSum] = useState(null);
  const [newRow, setNewRow]     = useState({});

  const load = () => {
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

  const handleAdd = () => {
    fetch("/api/checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newRow, id_employee: employeeId }),
    }).then(() => { setNewRow({}); load(); });
  };

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #checks-print-area, #checks-print-area * { visibility: visible !important; }
          #checks-print-area { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ display: "flex", background: "#f0f0f0", borderRadius: 8, padding: 3, gap: 2 }}>
          {[{ key: "today", label: "Сьогодні" }, { key: "period", label: "За період" }].map(m => (
            <button key={m.key} onClick={() => setMode(m.key)} style={{
              padding: "5px 14px", borderRadius: 6, border: "none",
              background: mode === m.key ? "#fff" : "transparent",
              fontWeight: mode === m.key ? 600 : 400, fontSize: 13, cursor: "pointer",
              boxShadow: mode === m.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s",
            }}>{m.label}</button>
          ))}
        </div>
        {mode === "period" && (
          <>
            <DateTimeInput label="Від" value={from} onChange={v => v && setFrom(v)} />
            <DateTimeInput label="До"  value={to}   onChange={v => v && setTo(v)} />
            <button onClick={load} style={applyBtnStyle}>Застосувати</button>
          </>
        )}
      </div>

      {totalSum !== null && (
        <div style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>
     <strong> Загальна сума за період:{parseFloat(totalSum).toFixed(2)} ₴</strong>
        </div>
      )}

      <div id="checks-print-area" style={{ overflow: "auto", maxHeight: "65vh", border: "0.5px solid #ddd", borderRadius: 12 }}>
        <table style={{ width: "max-content", minWidth: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f5f5f5" }}>
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
              <CheckRow
                key={row.check_number + i}
                check={row}
                columns={COLUMNS}
                onDelete={handleDelete}
                canDelete={canDelete}
              />
            ))}
            {canAdd && (
              <tr className="no-print">
                {COLUMNS.map(col => (
                  <td key={col.key} style={{ ...tdStyle, minWidth: 110 }}>
                    <input
                      value={newRow[col.key] ?? ""}
                      onChange={e => setNewRow(p => ({ ...p, [col.key]: e.target.value }))}
                      placeholder={col.label}
                      style={addInputStyle}
                    />
                  </td>
                ))}
                <td style={tdStyle} colSpan={canDelete ? 2 : 1}>
                  <button onClick={handleAdd} style={{ ...applyBtnStyle, fontSize: 12 }}>+ Додати</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const applyBtnStyle = {
  background: "#4a4a4a", color: "#fff", border: "none",
  borderRadius: 7, padding: "7px 16px", fontSize: 13,
  cursor: "pointer", fontWeight: 500,
};

const addInputStyle = {
  width: "100%", border: "none", outline: "none",
  fontSize: 13, background: "transparent", borderBottom: "1px solid #ccc",
};