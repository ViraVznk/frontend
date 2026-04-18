import { useState } from "react";

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

export function UniversalTable({ columns, data, onAdd, onDelete, onEdit }) {
  const [newRow, setNewRow] = useState({});
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editRow, setEditRow] = useState({});

  const handleAdd = () => {
    onAdd(newRow);
    setNewRow({});
  };

 const handleEditSave = (row) => {
  const merged = { ...row, ...editRow };
  const body = Object.fromEntries(
    Object.entries(merged).map(([k, v]) => [k, v])
  );
  onEdit(row[columns[0].key], body);
  setEditingIndex(null);
  setEditRow({});
};

  const showActions = onDelete || onEdit;

  return (
    <div style={{ border: "0.5px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            {columns.map(col => (
              <th key={col.key} style={thStyle}>{col.label}</th>
            ))}
            {showActions && <th style={thStyle}></th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col.key} style={tdStyle}>
                  {editingIndex === i ? (
                    <input
                      value={editRow[col.key] ?? row[col.key]}
                      onChange={e => setEditRow(prev => ({ ...prev, [col.key]: e.target.value }))}
                      style={{ width: "100%", border: "none", outline: "none", fontSize: 14, background: "transparent", borderBottom: "1px solid #aaa" }}
                    />
                  ) : (
                    row[col.key]
                  )}
                </td>
              ))}

              {showActions && (
                <td style={{ ...tdStyle, position: "relative", width: 60 }}>
                  {editingIndex === i ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleEditSave(row)} style={btnStyle("#4caf50")}>✓</button>
                      <button onClick={() => setEditingIndex(null)} style={btnStyle("#aaa")}>✕</button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setMenuOpenIndex(menuOpenIndex === i ? null : i)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" }}
                      >
                        ⋯
                      </button>

                      {menuOpenIndex === i && (
                        <div style={dropdownStyle}>
                          {onEdit && (
                            <div
                              style={menuItemStyle}
                              onClick={() => {
                                setEditingIndex(i);
                                setEditRow({});
                                setMenuOpenIndex(null);
                              }}
                            >
                             Редагувати
                            </div>
                          )}
                          {onDelete && (
                            <div
                              style={{ ...menuItemStyle, color: "#e53935" }}
                              onClick={() => {
                                onDelete(row);
                                setMenuOpenIndex(null);
                              }}
                            >
                            Видалити
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </td>
              )}
            </tr>
          ))}

          {onAdd && (
            <tr>
              {columns.map(col => (
                <td key={col.key} style={tdStyle}>
                  <input
                    value={newRow[col.key] || ""}
                    onChange={e => setNewRow(prev => ({ ...prev, [col.key]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                    placeholder={col.label}
                    style={{ width: "100%", border: "none", outline: "none", fontSize: 14, background: "transparent" }}
                  />
                </td>
              ))}
              <td style={tdStyle}>
                <button onClick={handleAdd}>+ Додати</button>
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
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            padding: "6px 16px",
            borderRadius: 8,
            border: "0.5px solid #ccc",
            background: activeView === key ? "#f0f0f0" : "transparent",
            cursor: "pointer",
            fontWeight: activeView === key ? 500 : 400,
          }}
        >
          {config[key].label}
        </button>
      ))}
    </div>
  );
}

const dropdownStyle = {
  position: "absolute",
  right: 0,
  top: "100%",
  background: "#fff",
  border: "0.5px solid #ddd",
  borderRadius: 8,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  zIndex: 100,
  minWidth: 150,
  overflow: "hidden",
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
});