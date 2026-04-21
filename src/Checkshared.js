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

export const btnStyle = (color) => ({
  background: color,
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
  padding: "4px 10px",
  whiteSpace: "nowrap",
  fontSize: 13,
});

function DeleteMenu({ onDelete }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuHeight = 48;
      const menuWidth = 160;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceRight = window.innerWidth - rect.right;
      setMenuPos({
        top: spaceBelow < menuHeight
          ? rect.top + window.scrollY - menuHeight
          : rect.bottom + window.scrollY,
        left: spaceRight < menuWidth
          ? rect.right + window.scrollX - menuWidth
          : rect.left + window.scrollX,
      });
    }
    setOpen(o => !o);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#5a5959" }}
      >
        ⋯
      </button>
      {open && (
        <div ref={menuRef} style={{
          position: "fixed",
          top: menuPos.top,
          left: menuPos.left,
          background: "#fbddee",
          border: "0.5px solid #de97c0",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 9999,
          minWidth: 160,
          overflow: "hidden",
        }}>
          <div
            style={{ padding: "10px 16px", cursor: "pointer", fontSize: 14, color: "#651413", userSelect: "none" }}
            onClick={() => { onDelete(); setOpen(false); }}
            onMouseEnter={e => e.currentTarget.style.background = "#fff5f5"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            Видалити
          </div>
        </div>
      )}
    </>
  );
}
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
    <div style={{ padding: "10px 20px 12px", background: "#f9fafb", borderTop: "0.5px solid #ebebeb" }}>
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


export function CheckRow({ check, columns, onDelete, canDelete }) {
  return (
    <>
      <tr
        style={{ background: "white" }}
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
             <DeleteMenu onDelete={() => onDelete(check)} />
              </td>
            )}
      </tr>
      <tr>
        <td colSpan={columns.length + (canDelete ? 1 : 0)} style={{ padding: 0, borderBottom: "1px solid #e0e0e0" }}>
          <SalesPanel checkNumber={check.check_number} />
        </td>
      </tr>
    </>
  );
}

export function EmployeeDropdown({ value, onChange }) {
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetch("/api/employees")
      .then(r => r.json())
      .then(data => setEmployees(data.filter(e => (e.empl_role ?? "").toLowerCase() === "cashier")))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected = employees.find(e => e.id_employee === value);
  const label = selected ? `${selected.empl_surname} ${selected.empl_name}` : "Всі касири";

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
            >— Всі касири —</div>
            {employees.map(e => {
              const isSel = value === e.id_employee;
              return (
                <div key={e.id_employee} onMouseDown={() => { onChange(e.id_employee); setOpen(false); }}
                  style={{
                    padding: "8px 12px", cursor: "pointer", fontSize: 13,
                    background: isSel ? "#f0f0f0" : "transparent",
                    borderBottom: "0.5px solid #f5f5f5",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    fontWeight: isSel ? 500 : 400,
                  }}
                  onMouseEnter={ev => { if (!isSel) ev.currentTarget.style.background = "#fafafa"; }}
                  onMouseLeave={ev => { ev.currentTarget.style.background = isSel ? "#f0f0f0" : "transparent"; }}
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

export function StoreProductDropdown({ value, onChange, products }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected = products.find(p => (p.UPC ?? p.upc) === value);
  const label = selected
    ? `${selected.PRODUCT_NAME ?? selected.product_name ?? selected.UPC ?? selected.upc} (${parseFloat(selected.SELLING_PRICE ?? selected.selling_price).toFixed(2)} ₴)`
    : "— оберіть товар —";

  const filtered = products.filter(p =>
    (p.PRODUCT_NAME ?? p.product_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.UPC ?? p.upc ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 260 }}>
      <button
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, width: "100%", padding: "4px 8px",
          border: "none", borderBottom: "1px solid #ccc", borderRadius: 0,
          background: "transparent", cursor: "pointer", fontSize: 13,
          color: value ? "#333" : "#aaa", textAlign: "left",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <span style={{ fontSize: 10, color: "#aaa", flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 2px)", left: 0,
          minWidth: 280, background: "#fff",
          border: "0.5px solid #ddd", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          zIndex: 9999,
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "0.5px solid #eee" }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Пошук товару…"
              style={{ width: "100%", border: "none", outline: "none", fontSize: 13, background: "transparent" }}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "8px 12px", color: "#bbb", fontSize: 13 }}>Нічого не знайдено</div>
            ) : filtered.map(p => {
              const isSel = value === (p.UPC ?? p.upc);
              const upc = p.UPC ?? p.upc;
              const name = p.PRODUCT_NAME ?? p.product_name ?? upc;
              const price = parseFloat(p.SELLING_PRICE ?? p.selling_price ?? 0).toFixed(2);
              return (
                <div key={(p.UPC ?? p.upc)} onMouseDown={() => { onChange((p.UPC ?? p.upc)); setOpen(false); setSearch(""); }}
                  style={{
                    padding: "8px 12px", cursor: "pointer", fontSize: 13,
                    background: isSel ? "#f0f0f0" : "transparent",
                    borderBottom: "0.5px solid #f5f5f5",
                    display: "flex", justifyContent: "space-between",
                  }}
                  onMouseEnter={ev => { if (!isSel) ev.currentTarget.style.background = "#fafafa"; }}
                  onMouseLeave={ev => { ev.currentTarget.style.background = isSel ? "#f0f0f0" : "transparent"; }}
                >
                  <span style={{ color: "#333" }}>{p.PRODUCT_NAME ?? p.product_name ?? p.UPC ?? p.upc}</span>
                  <span style={{ color: "#aaa", fontSize: 12 }}>{parseFloat(p.SELLING_PRICE ?? p.selling_price ?? 0).toFixed(2)} ₴</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function CheckNumberDropdown({ value, onChange, employeeId }) {
  const [checks, setChecks] = useState([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const url = employeeId ? `/api/checks/employee/${employeeId}?from=2000-01-01T00:00:00&to=2099-01-01T00:00:00` : `/api/checks/all`;
    fetch(url)
      .then(r => r.ok ? r.json() : [])
      .then(setChecks)
      .catch(console.error);
  }, [employeeId]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = checks.filter(c =>
    c.check_number.toLowerCase().includes(search.toLowerCase())
  );

  const label = value || "— оберіть номер чеку —";

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 220 }}>
      <button
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, width: "100%", padding: "4px 8px",
          border: "none", borderBottom: "1.5px solid #ccc", borderRadius: 0,
          background: "transparent", cursor: "pointer", fontSize: 13,
          color: value ? "#333" : "#aaa", textAlign: "left",
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: 10, color: "#aaa" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 2px)", left: 0,
          minWidth: 260, background: "#fff",
          border: "0.5px solid #ddd", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          zIndex: 9999,
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "0.5px solid #eee" }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Пошук за номером…"
              style={{ width: "100%", border: "none", outline: "none", fontSize: 13, background: "transparent" }}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "8px 12px", color: "#bbb", fontSize: 13 }}>Нічого не знайдено</div>
            ) : filtered.map(c => {
              const isSel = value === c.check_number;
              return (
                <div key={c.check_number} onMouseDown={() => { onChange(c.check_number); setOpen(false); setSearch(""); }}
                  style={{
                    padding: "8px 12px", cursor: "pointer", fontSize: 13,
                    background: isSel ? "#f0f0f0" : "transparent",
                    borderBottom: "0.5px solid #f5f5f5",
                    display: "flex", justifyContent: "space-between",
                  }}
                  onMouseEnter={ev => { if (!isSel) ev.currentTarget.style.background = "#fafafa"; }}
                  onMouseLeave={ev => { ev.currentTarget.style.background = isSel ? "#f0f0f0" : "transparent"; }}
                >
                  <span style={{ color: "#333", fontFamily: "monospace" }}>{c.check_number}</span>
                  <span style={{ color: "#aaa", fontSize: 12 }}>
                    {c.print_date ? new Date(c.print_date).toLocaleDateString("uk-UA") : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
  
}