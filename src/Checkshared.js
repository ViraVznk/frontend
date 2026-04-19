import { useState, useEffect, useRef } from "react";

export const thStyle = {
  padding: "10px 14px",
  textAlign: "left",
  fontWeight: 500,
  color: "#666",
  borderBottom: "0.5px solid #ddd",
  whiteSpace: "nowrap",
};

export const tdStyle = {
  padding: "10px 14px",
  borderBottom: "0.5px solid #eee",
};

export function formatDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleString("uk-UA", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── SalesPanel — завжди видимий, без toggle ───────────────────────────────────

export function SalesPanel({ checkNumber }) {
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/checks/${checkNumber}/sales`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setSales(d); setLoading(false); })
      .catch(() => { setSales([]); setLoading(false); });
  }, [checkNumber]);

  return (
    <div style={{
      padding: "10px 20px 12px",
      background: "#f9fafb",
      borderTop: "0.5px solid #ebebeb",
    }}>
      {loading ? (
        <span style={{ fontSize: 12, color: "#bbb" }}>Завантаження…</span>
      ) : !sales || sales.length === 0 ? (
        <span style={{ fontSize: 12, color: "#bbb" }}>Немає товарів</span>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ebebeb" }}>
              {["UPC", "Назва", "К-сть", "Ціна"].map(h => (
                <th key={h} style={{ padding: "3px 10px", textAlign: "left", color: "#bbb", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.map((s, i) => (
              <tr key={i}>
                <td style={{ padding: "4px 10px", color: "#bbb" }}>{s.UPC ?? s.upc}</td>
                <td style={{ padding: "4px 10px", color: "#555" }}>{s.product_name ?? s.PRODUCT_NAME}</td>
                <td style={{ padding: "4px 10px", color: "#555" }}>{s.product_number ?? s.PRODUCT_NUMBER}</td>
                <td style={{ padding: "4px 10px", color: "#555" }}>{parseFloat(s.selling_price ?? s.SELLING_PRICE ?? 0).toFixed(2)} ₴</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── CheckRow — товари завжди під рядком ───────────────────────────────────────

export function CheckRow({ check, columns, onDelete, canDelete }) {
  return (
    <>
      <tr style={{ background: "white" }}
        onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
        onMouseLeave={e => e.currentTarget.style.background = "white"}
      >
        {columns.map(col => (
          <td key={col.key} style={{ ...tdStyle, whiteSpace: "nowrap" }}>
            {col.key === "print_date" ? formatDate(check[col.key]) : (check[col.key] ?? "—")}
          </td>
        ))}
        {canDelete && (
          <td style={{ ...tdStyle, width: 50 }}>
            <button
              onClick={() => onDelete(check)}
              style={deleteBtnStyle}
              title="Видалити чек"
            >✕</button>
          </td>
        )}
      </tr>
      <tr>
        <td
          colSpan={columns.length + (canDelete ? 1 : 0)}
          style={{ padding: 0, borderBottom: "1px solid #e0e0e0" }}
        >
          <SalesPanel checkNumber={check.check_number} />
        </td>
      </tr>
    </>
  );
}

// ── EmployeeDropdown — dropdown при кліку ─────────────────────────────────────

export function EmployeeDropdown({ value, onChange }) {
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetch("/api/employees")
      .then(r => r.json())
      .then(data => setEmployees(
        data.filter(e => (e.empl_role ?? "").toLowerCase() === "cashier")
      ))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = employees.find(e => e.id_employee === value);
  const label = selected
    ? `${selected.empl_surname} ${selected.empl_name}`
    : "Всі касири";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "#888", fontWeight: 500, letterSpacing: "0.04em" }}>КАСИР</span>
      <div ref={ref} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 8, minWidth: 210, padding: "6px 10px",
            border: "0.5px solid #ddd", borderRadius: 7,
            background: "#fff", cursor: "pointer", fontSize: 13,
            color: value ? "#333" : "#888",
          }}
        >
          <span>{label}</span>
          <span style={{ fontSize: 10, color: "#aaa" }}>{open ? "▲" : "▼"}</span>
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0,
            minWidth: 210, background: "#fff",
            border: "0.5px solid #ddd", borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            zIndex: 9999, maxHeight: 200, overflowY: "auto",
          }}>
            <div
              onMouseDown={() => { onChange(null); setOpen(false); }}
              style={{
                padding: "8px 12px", cursor: "pointer", fontSize: 13,
                background: value === null ? "#f0f0f0" : "transparent",
                borderBottom: "0.5px solid #f0f0f0",
                color: value === null ? "#333" : "#888",
                fontWeight: value === null ? 500 : 400,
              }}
            >
              — Всі касири —
            </div>
            {employees.map(e => {
              const isSelected = value === e.id_employee;
              return (
                <div
                  key={e.id_employee}
                  onMouseDown={() => { onChange(e.id_employee); setOpen(false); }}
                  style={{
                    padding: "8px 12px", cursor: "pointer", fontSize: 13,
                    background: isSelected ? "#f0f0f0" : "transparent",
                    borderBottom: "0.5px solid #f5f5f5",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    fontWeight: isSelected ? 500 : 400,
                  }}
                  onMouseEnter={ev => { if (!isSelected) ev.currentTarget.style.background = "#fafafa"; }}
                  onMouseLeave={ev => { ev.currentTarget.style.background = isSelected ? "#f0f0f0" : "transparent"; }}
                >
                  <span style={{ color: "#333" }}>{e.empl_surname} {e.empl_name}</span>
                  <span style={{ fontSize: 11, color: "#aaa" }}>{e.id_employee}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export const deleteBtnStyle = {
  background: "none",
  border: "0.5px solid #f0c0c0",
  borderRadius: 6,
  color: "#e53935",
  cursor: "pointer",
  fontSize: 13,
  padding: "2px 8px",
  lineHeight: 1.4,
};