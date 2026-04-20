import { useState, useEffect, useRef } from "react";

export const thStyle = {
  padding: "10px 14px",
  textAlign: "left",
  fontWeight: 500,
  color: "#666",
  borderBottom: "0.5px solid #ddd"
};

export const tdStyle = {
  padding: "10px 14px",
  borderBottom: "0.5px solid #eee"
};

function FkInput({ col, value, onChange }) {
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value ?? "");
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 200 });
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!col.foreignKey) return;
    fetch(col.foreignKey.url)
      .then(r => r.json())
      .then(setOptions)
      .catch(console.error);
  }, [col]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);

    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleFocus = () => {
    if (!col.foreignKey) return;
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropHeight = 200;
      setDropPos({
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 220),
        ...(spaceBelow < dropHeight
          ? { top: rect.top + window.scrollY - dropHeight, bottom: "auto" }
          : { top: rect.bottom + window.scrollY, bottom: "auto" })
      });
    }
    setSearch("");
    setOpen(true);
  };

  if (!col.foreignKey) {
    return (
      <input
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
      />
    );
  }

  const filtered = options.filter(opt =>
    String(opt[col.foreignKey.valueKey]).includes(search) ||
    String(opt[col.foreignKey.labelKey]).includes(search)
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        value={search}
        readOnly
        onClick={handleFocus}
        placeholder={col.label}
        style={inputStyle}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "fixed",
          top: dropPos.top,
          left: dropPos.left,
          width: dropPos.width,
          background: "#fff",
          border: "0.5px solid #ddd",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          zIndex: 9999,
          maxHeight: 200,
          overflowY: "auto",
        }}>
          <div
            style={fkOptionStyle}
            onMouseDown={() => {
              onChange(null);
              setSearch("");
              setOpen(false);
            }}
          >
            <span style={{ color: "#888" }}>— Всі —</span>
          </div>
          {filtered.map(opt => (
            <div
              key={opt[col.foreignKey.valueKey]}
              style={fkOptionStyle}
              onMouseDown={() => {
                const val = opt[col.foreignKey.valueKey];
                const label = opt[col.foreignKey.labelKey];
                onChange(val);
                setSearch(label);
                setOpen(false);
              }}
            >
              <span style={{ fontWeight: 500 }}>{opt[col.foreignKey.valueKey]}</span>
              <span style={{ color: "#888", marginLeft: 8 }}>{opt[col.foreignKey.labelKey]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionMenu({ onEdit, onDelete, row, i, editingIndex, setEditingIndex, setEditRow, handleEditSave, editRow, columns }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }

    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuHeight = 90;
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

  if (editingIndex === i) {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => handleEditSave(row)} style={btnStyle("#4caf50")}>✓</button>
        <button onClick={() => { setEditingIndex(null); setEditRow({}); }} style={btnStyle("#aaa")}>✕</button>
      </div>
    );
  }

  return (
    <>
      <button ref={btnRef} onClick={handleOpen}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" }}>
        ⋯
      </button>

      {open && (
        <div ref={menuRef} style={{
          position: "fixed",
          top: menuPos.top,
          left: menuPos.left,
          background: "#fff",
          border: "0.5px solid #ddd",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 9999,
          minWidth: 160,
          overflow: "hidden",
        }}>
          {onEdit && (
            <div style={menuItemStyle} onClick={() => {
              setEditingIndex(i);
              setEditRow({});
              setOpen(false);
            }}>
              Редагувати
            </div>
          )}
          {onDelete && (
            <div style={{ ...menuItemStyle, color: "#e53935" }} onClick={() => {
              onDelete(row);
              setOpen(false);
            }}>
              Видалити
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function UniversalTable({ columns, data, onAdd, onDelete, onEdit }) {
  const [newRow, setNewRow] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);
  const [editRow, setEditRow] = useState({});

  const handleAdd = () => {
    onAdd(newRow);
    setNewRow({});
  };

  const handleEditSave = (row) => {
    const merged = { ...row, ...editRow };
    onEdit(row[columns[0].key], merged);
    setEditingIndex(null);
    setEditRow({});
  };

  const [fkLabels, setFkLabels] = useState({});

  useEffect(() => {
    columns.forEach(col => {
      if (!col.foreignKey) return;
      fetch(col.foreignKey.url)
        .then(r => r.json())
        .then(options => {
          const map = {};
          options.forEach(opt => {
            map[opt[col.foreignKey.valueKey]] = opt[col.foreignKey.labelKey];
          });
          setFkLabels(prev => ({ ...prev, [col.key]: map }));
        });
    });
  }, [columns]);

  const showActions = onDelete || onEdit;

  return (
    <div style={{ overflow: "auto", maxHeight: "70vh", border: "0.5px solid #ddd", borderRadius: 12 }}>
      <table style={{ width: "max-content", minWidth: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f5f5f5" }}>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{ ...thStyle, whiteSpace: "nowrap" }}>{col.label}</th>
            ))}
            {showActions && <th style={{ ...thStyle, width: 60 }}></th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ background: editingIndex === i ? "#fafafa" : "white" }}>
              {columns.map(col => (
                <td key={col.key} style={{ ...tdStyle, whiteSpace: editingIndex === i ? "normal" : "nowrap" }}>
                  {editingIndex === i ? (
                    <FkInput
                      col={col}
                      value={editRow[col.key] ?? row[col.key]}
                      onChange={v => setEditRow(prev => ({ ...prev, [col.key]: v }))}
                    />
                  ) : (
                    col.foreignKey && fkLabels[col.key]
                      ? fkLabels[col.key][row[col.key]] ?? row[col.key]
                      : row[col.key]
                  )}
                </td>
              ))}

              {showActions && (
                <td style={{ ...tdStyle, width: 60 }}>
                  <ActionMenu
                    row={row}
                    i={i}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    editingIndex={editingIndex}
                    setEditingIndex={setEditingIndex}
                    editRow={editRow}
                    setEditRow={setEditRow}
                    handleEditSave={handleEditSave}
                    columns={columns}
                  />
                </td>
              )}
            </tr>
          ))}

          {onAdd && (
            <tr>
              {columns.map(col => (
                <td key={col.key} style={{ ...tdStyle, minWidth: 120 }}>
                  <FkInput
                    col={col}
                    value={newRow[col.key] ?? ""}
                    onChange={v => setNewRow(prev => ({ ...prev, [col.key]: v }))}
                  />
                </td>
              ))}
              <td style={tdStyle}>
                <button onClick={handleAdd} style={btnStyle("#666f76")}>+ Додати</button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function TabSwitcher({ views, activeView, onChange, config }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
      {views.map(key => (
        <button key={key} onClick={() => onChange(key)} style={{
          padding: "6px 16px",
          borderRadius: 8,
          border: "0.5px solid #ccc",
          background: activeView === key ? "#f0f0f0" : "transparent",
          cursor: "pointer",
          fontWeight: activeView === key ? 500 : 400,
        }}>
          {config[key].label}
        </button>
      ))}
    </div>
  );
}

export function FilterBar({ filters, values, onChange, onReset }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
      {filters.map(filter => {

        if (filter.type === "select-static") return (
          <div key={filter.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#666" }}>{filter.label}:</span>
            <select
              value={values[filter.label] ?? filter.options[0].value}
              onChange={e => onChange(filter, e.target.value)}
              style={{ fontSize: 13, border: "0.5px solid #ccc", borderRadius: 6, padding: "4px 8px", background: "transparent" }}
            >
              {filter.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        );

        if (filter.type === "sort") {
          const isActive = filter.dependsOn
            ? (filter.dependsOnValues ?? []).includes(
                values[filter.dependsOn] ?? "all"
              )
            : true;

          return (
            <div key={filter.label} style={{
              display: "flex", alignItems: "center", gap: 8,
              opacity: isActive ? 1 : 0.35,
              pointerEvents: isActive ? "auto" : "none",
            }}>
              <span style={{ fontSize: 13, color: "#666" }}>Сортувати за:</span>
              <select
                value={values[filter.label] ?? filter.options[0].value}
                onChange={e => onChange(filter, e.target.value)}
                style={{ fontSize: 13, border: "0.5px solid #ccc", borderRadius: 6, padding: "4px 8px", background: "transparent" }}
              >
                {filter.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          );
        }

        if (filter.type === "search") return (
          <div key={filter.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#666" }}>{filter.label}:</span>
            <SearchInput filter={filter} value={values[filter.label] ?? ""} onChange={onChange} />
          </div>
        );
        return (
          <div key={filter.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#666", whiteSpace: "nowrap" }}>{filter.label}:</span>
            <div style={{ minWidth: 200 }}>
              <FkInput
                col={{ label: "усі", foreignKey: filter.foreignKey }}
                value={values[filter.label] ?? ""}
                onChange={(val) => onChange(filter, val || null)}
                onClear={() => onChange(filter, null)}
              />
            </div>
          </div>
        );
      })}

      <button onClick={onReset} style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 6, border: "0.5px solid #ccc", cursor: "pointer", background: "transparent", fontSize: 13 }}>
        ↺ Відновити
      </button>
    </div>
  );
}

function SearchInput({ filter, value, onChange }) {
  const [text, setText] = useState(value);

  const apply = (val) => onChange(filter, val || null);

  return (
    <input
      value={text}
      onChange={e => setText(e.target.value)}
      onKeyDown={e => e.key === "Enter" && apply(text)}
      onBlur={() => apply(text)}
      placeholder="введіть..."
      style={inputStyle}
    />
  );
}

const fkOptionStyle = {
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  borderBottom: "0.5px solid #f0f0f0",
};

const inputStyle = {
  width: "100%",
  border: "none",
  outline: "none",
  fontSize: 14,
  background: "transparent",
  borderBottom: "1px solid #aaa",
};

const menuItemStyle = {
  padding: "10px 16px",
  cursor: "pointer",
  fontSize: 14,
  userSelect: "none",
};

const btnStyle = (color) => ({
  background: color,
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
  padding: "4px 10px",
  whiteSpace: "nowrap",
});