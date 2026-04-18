import { useEffect, useState } from "react";
import { UniversalTable, TabSwitcher } from "./TableComponents";

const VIEWS = ["categories", "products"];

const VIEW_CONFIG = {
  categories: {
    label: "Категорії",
    url: "/api/categories",
    canAdd: false,
    canDelete: true,
    canEdit: true,
    columns: [
      { key: "category_number", label: "ID" },
      { key: "category_name", label: "Назва" },
    ],
  },
  products: {
    label: "Товари",
    url: "/api/products",
    canAdd: true,
    canDelete: true,
    canEdit: true,
    columns: [
      { key: "ID_PRODUCT", label: "ID" },
      { key: "PRODUCT_NAME", label: "Назва" },
      { key: "MANUFACTURER", label: "Виробник" },
    ],
  },
};

export default function CashierPage({ logout }) {
  const [activeView, setActiveView] = useState("categories");
  const [data, setData] = useState([]);

  const view = VIEW_CONFIG[activeView];

  const loadData = () => {
    fetch(view.url)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  };

  useEffect(() => { loadData(); }, [activeView]);


  const handleAdd = (newRow) => {
    const body = Object.fromEntries(
      Object.entries(newRow).map(([k, v]) => [k.toLowerCase(), v])
    );
    fetch(view.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(loadData);
  };

  const handleDelete = (row) => {
    const id = row[view.columns[0].key];
    fetch(`${view.url}/${id}`, { method: "DELETE" }).then(loadData);
  };

 const handleEdit = (id, body) => {
  fetch(`${view.url}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(loadData);
};

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Cashier Panel</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <TabSwitcher
        views={VIEWS}
        activeView={activeView}
        onChange={setActiveView}
        config={VIEW_CONFIG}
      />

        <UniversalTable
        columns={view.columns}
        data={data}
        onAdd={view.canAdd ? handleAdd : undefined}
        onDelete={view.canDelete ? handleDelete : undefined}
        onEdit={view.canEdit ? handleEdit : undefined}
      />
    </div>
  );
}