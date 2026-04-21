import { useState } from "react";
import { UniversalTable } from "./TableComponents";


const STATS_QUERIES = [
  {
    id: "sql1",
    label: "sql1A",
    description: "Загальна кількість проданих одиниць товару згрупована по категоріях",
    url: () => "/api/anna/sql1",
    params: [],
    columns: [
      { key: "CATEGORY_NUMBER", label: "ID" },
      { key: "CATEGORY_NAME",   label: "Категорія" },
      { key: "PRODUCTS_SOLD",   label: "Продано одиниць" },
    ],
  },
  {
  id: "sql2",
  label: "sql2A",
  description: "Чеки, в яких були куплені всі товари з обраної категорії",
  url: (params) => `/api/anna/sql2/${params.category_number}`,
  params: [
    { key: "category_number", label: "Номер категорії"},
  ],
  columns: [
    { key: "check_number", label: "Номер чеку" },
    { key: "id_employee",  label: "Касир" },
    { key: "print_date",   label: "Дата" },
    { key: "sum_total",    label: "Сума" },
  ],
},
  {
    id: "sql3",
    label: "sql1V",
    description: "Клієнт з максимальною кількістю куплених товарів",
    url: () => "/api/vira/sql1",
    params: [],
    columns: [
      { key: "CARD_NUMBER", label: "номер карти" },
      { key: "CUST_SURNAME", label: "прізвище" },
      { key: "CUST_NAME", label: "ім'я" },
      { key: "PRODUCTS_BOUGHT", label: "к-кість куплених продуктів" }
    ],
  },
  {
    id: "sql4",
    label: "sql2V",
    description: "Клієнт що має хоча б 1 продукт обраної категорії в усіх чеках",
    url: (params) => `/api/vira/sql2/${params.category_number}`,
    params: [
    { key: "category_number", label: "Номер категорії"},
  ],
    columns: [
      { key: "card_number", label: "номер карти" },
      { key: "cust_surname", label: "прізвище" },
      { key: "cust_name", label: "ім'я" }
    ],
  }
  
];

export default function StatsPage() {
  const [activeQuery, setActiveQuery] = useState(null);
  const [paramValues, setParamValues]  = useState({});
  const [data, setData]                = useState([]);
  const [error, setError]              = useState(null);

  const handleSelect = (query) => {
    setActiveQuery(query);
    setParamValues({});
    setData([]);
    setError(null);
  };

  const handleRun = async () => {
    if (!activeQuery) return;
    setError(null);
    try {
      const url = activeQuery.url(paramValues);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setData(Array.isArray(d) ? d : [d]);
    } catch (e) {
      setError("Помилка запиту: " + e.message);
      setData([]);
    } 
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
        {STATS_QUERIES.map(q => (
          <button
            key={q.id}
            onClick={() => handleSelect(q)}
            style={{
              padding: "6px 16px", borderRadius: 8,
              border: "0.5px solid #e6b1d2",
              background: activeQuery?.id === q.id ? "#ffebf7" : "transparent",
              cursor: "pointer",
              fontWeight: activeQuery?.id === q.id ? 500 : 400,
            }}
          >
            {q.label}
          </button>
        ))}
      </div>

      
      {activeQuery && (
        <div style={{ marginBottom: "1rem", padding: "12px 16px", border: "0.5px solid #eee", borderRadius: 8 }}>
          <p style={{ fontSize: 13, color: "#666", marginBottom: "0.75rem" }}>
            {activeQuery.description}
          </p>

          {activeQuery.params.map(p => (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <label style={{ fontSize: 13, color: "#444", minWidth: 160 }}>{p.label}:</label>
              <input
                value={paramValues[p.key] ?? ""}
                onChange={e => setParamValues(prev => ({ ...prev, [p.key]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleRun()}
                style={{
                  border: "none", borderBottom: "1px solid #de97c0",
                  outline: "none", fontSize: 14, background: "transparent", padding: "2px 0",
                }}
              />
            </div>
          ))}

          <button
            onClick={handleRun}
            
            style={{
              marginTop: 8, padding: "6px 16px", borderRadius: 8,
              border: "0.5px solid #de97c0", cursor: "pointer",
              background: "transparent", fontSize: 13,
            }}
          >
            { "▶ Виконати"}
          </button>

          {error && <p style={{ color: "#e53935", fontSize: 13, marginTop: 8 }}>{error}</p>}
        </div>
      )}


      {data.length > 0 && activeQuery && (
        <UniversalTable
          columns={activeQuery.columns}
          data={data}
          onAdd={undefined}
          onDelete={undefined}
          onEdit={undefined}
        />
      )}
    </div>
  );
}