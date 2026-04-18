import { useEffect, useState } from "react";
import { UniversalTable, TabSwitcher } from "./TableComponents";

const VIEWS = ["categories", "products","employee","storeProduct"];

const VIEW_CONFIG = {
  categories: {
    label: "Категорії",
    url: "/api/categories",
    canAdd: true,
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
      { key: "id_product", label: "ID" },
       {key: "category_number",
        label: "Категорія",
        foreignKey: {
          url: "/api/categories",
          valueKey: "category_number",
          labelKey: "category_name"
        }
      },
      { key: "product_name", label: "Назва" },
      { key: "manufacturer", label: "Виробник" },
      { key: "characteristics", label: "Характеристики" },
    ],
  },
    employee:{
      label: "Працівники",
      url: "/api/employees",
      canAdd: true,
      canDelete: true,
      canEdit: true,
      columns: [
      { key: "id_employee", label: "ID" },
      { key: "empl_surname", label: "Фамілія" },
      { key: "empl_name", label: "Імя" },
      { key: "empl_role", label: "Роль" },
      { key: "salary", label: "Зарплата" },
      { key: "date_of_birth", label: "Дата народження" },
      { key: "date_of_start", label: "Дата початку роботи" },
      { key: "phone_number", label: "Номер телефону" },
      { key: "city", label: "Місто" },
      { key: "street", label: "Вулиця" },
      { key: "zip_code", label: "zip_code" },
      ],
    
    },
    storeProduct: {
    label: "Товари в магазині",
    url: "/api/store-products",
    canAdd: true,
    canDelete: true,
    canEdit: true,
    columns: [
    { key: "upc", label: "UPC" },
    { key: "upc_prom", label: "Акційний UPC" },
    { key: "product_id", label: "ID товару" },
    { key: "selling_price", label: "Ціна" },
    { key: "products_number", label: "Кількість" },
    { key: "promotional", label: "Акційний" },
    ],
  },
};

export default function ManagerPage({ logout }) {
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
      Object.entries(newRow).map(([k, v]) => [k, v])
    );
    fetch(view.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(loadData);
  };
  
  const handleDelete = (row) => {
  const id = row[view.columns[0].key];
  fetch(`${view.url}/${id}`, { method: "DELETE" })
    .then(res => {
      if (!res.ok) return res.text().then(msg => alert(msg));
      loadData();
    });
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
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Manager Panel</h1>
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