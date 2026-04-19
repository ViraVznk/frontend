import { useEffect, useState } from "react";
import { UniversalTable, TabSwitcher, FilterBar } from "./TableComponents";
import ChecksView from "./ChecksView";

const VIEWS = ["categories", "products", "storeProduct", "check"];

const VIEW_CONFIG = {
  categories: {
    label: "Категорії",
    url: "/api/categories",
    canAdd: false, canDelete: true, canEdit: true,
    columns: [
      { key: "category_number", label: "ID" },
      { key: "category_name", label: "Назва" },
    ],
  },
  products: {
    label: "Товари",
    url: "/api/products",
    canAdd: true, canDelete: true, canEdit: true,
    filters: [{
      label: "Фільтр за категорією",
      foreignKey: { url: "/api/categories", valueKey: "category_number", labelKey: "category_name" },
      buildUrl: (value) => value ? `/api/products/bycategory/${value}` : `/api/products`,
    }],
    columns: [
      { key: "id_product", label: "ID" },
      { key: "product_name", label: "Назва" },
      { key: "manufacturer", label: "Виробник" },
    ],
  },
  storeProduct: {
    label: "Товари в магазині",
    url: "/api/store-products",
    canAdd: true, canDelete: true, canEdit: true,
    filters: [
      {
        label: "Тип товару",
        type: "select-static",
        options: [
          { value: "all", label: "Всі" },
          { value: "prom", label: "Акційні" },
          { value: "notprom", label: "Не акційні" },
        ],
        buildUrl: (type, sort) => {
          if (type === "prom") return `/api/store-products/promotional/by-${sort}`;
          if (type === "notprom") return `/api/store-products/not-promotional/by-${sort}`;
          return `/api/store-products/by-${sort}`;
        },
      },
      {
        label: "Сортувати за",
        type: "sort",
        dependsOn: "Тип товару",
        dependsOnValues: ["prom", "notprom"],
        options: [
          { value: "quantity", label: "Кількість" },
          { value: "name", label: "Назва" },
        ],
      },
    ],
    columns: [
      { key: "upc", label: "UPC" },
      { key: "upc_prom", label: "Акційний UPC" },
      { key: "product_id", label: "Назва", foreignKey: { url: "/api/products", valueKey: "id_product", labelKey: "product_name" } },
      { key: "selling_price", label: "Ціна" },
      { key: "products_number", label: "Кількість" },
    ],
  },
};

export default function CashierPage({ logout, employeeId }) {
  const [activeView, setActiveView] = useState("categories");
  const [data, setData] = useState([]);
  const [filterValues, setFilterValues] = useState({});

  const view = VIEW_CONFIG[activeView];

  const loadData = (overrideUrl) => {
    if (activeView === "check" || !view) return;
    fetch(overrideUrl ?? view.url)
      .then(res => res.ok ? res.json() : [])
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]));
  };

  useEffect(() => {
    setFilterValues({});
    loadData();
  }, [activeView]);

  const handleAdd = (newRow) => {
    fetch(view.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRow),
    }).then(() => loadData());
  };

  const handleDelete = (row) => {
    const id = row[view.columns[0].key];
    fetch(`${view.url}/${id}`, { method: "DELETE" })
      .then(res => { if (!res.ok) return res.text().then(msg => alert(msg)); loadData(); });
  };

  const handleEdit = (id, body) => {
    fetch(`${view.url}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(() => loadData());
  };

  const handleFilterChange = (filter, value) => {
    const newValues = { ...filterValues, [filter.label]: value };
    setFilterValues(newValues);
    const currentView = VIEW_CONFIG[activeView];
    if (!currentView?.filters) { loadData(); return; }
    if (filter.type === "search") { loadData(filter.buildUrl(value)); return; }
    const mainFilter = currentView.filters.find(f => f.type === "select-static");
    const sortFilter = currentView.filters.find(f => f.type === "sort");
    if (mainFilter) {
      const typeValue = newValues[mainFilter.label] ?? mainFilter.options[0].value;
      const sortValue = newValues[sortFilter?.label] ?? sortFilter?.options[0].value ?? "name";
      loadData(mainFilter.buildUrl(typeValue, sortValue));
      return;
    }
    loadData(filter.buildUrl(value));
  };

  const handleReset = () => { setFilterValues({}); loadData(); };

  const tabConfig = { ...VIEW_CONFIG, check: { label: "Чеки" } };

  return (
    <div style={{ maxWidth: 960, margin: "2rem auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>Cashier Panel</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <TabSwitcher views={VIEWS} activeView={activeView} onChange={setActiveView} config={tabConfig} />

      {activeView === "check" ? (
        <ChecksView employeeId={employeeId} canDelete={true} canAdd={true} />
      ) : (
        <>
          {view?.filters && (
            <FilterBar
              filters={view.filters}
              values={filterValues}
              onChange={handleFilterChange}
              onReset={handleReset}
            />
          )}
          {view && (
            <UniversalTable
              columns={view.columns}
              data={data}
              onAdd={view.canAdd ? handleAdd : undefined}
              onDelete={view.canDelete ? handleDelete : undefined}
              onEdit={view.canEdit ? handleEdit : undefined}
            />
          )}
        </>
      )}
    </div>
  );
}