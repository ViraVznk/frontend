import { useEffect, useState } from "react";
import { UniversalTable, TabSwitcher, FilterBar } from "./TableComponents";
import Mchecksview from "./Mchecksview";
import { PrintPanel } from "./PrintPanel";
import StatsPage from "./StatsPage";

const VIEWS = ["categories", "products", "storeProduct", "employee", "checks", "customerCard", "stats"];

const VIEW_CONFIG = {
  categories: {
    label: "Категорії",
    url: "/api/categories",
    canAdd: true, canDelete: true, canEdit: true,
    columns: [
      { key: "category_number", label: "ID" },
      { key: "category_name", label: "Назва" },
    ],
  },
  products: {
    label: "Товари",
    url: "/api/products",
    canAdd: true, canDelete: true, canEdit: true,
    filters: [
      {
        label: "Фільтр за категорією",
        foreignKey: { url: "/api/categories", valueKey: "category_number", labelKey: "category_name" },
        buildUrl: (value) => value ? `/api/products/bycategory/${value}` : `/api/products`,
      },
      {
        label: "Пошук за назвою",
        type: "search",
        buildUrl: (value) => value ? `/api/products/search?name=${encodeURIComponent(value)}` : `/api/products`,
      },
    ],
    columns: [
      { key: "id_product", label: "ID" },
      { key: "category_number", label: "Категорія", foreignKey: { url: "/api/categories", valueKey: "category_number", labelKey: "category_name" } },
      { key: "product_name", label: "Назва" },
      { key: "manufacturer", label: "Виробник" },
      { key: "characteristics", label: "Характеристики" },
    ],
  },
  employee: {
    label: "Працівники",
    url: "/api/employees",
    canAdd: true, canDelete: true, canEdit: true,
    columns: [
      { key: "id_employee", label: "ID" },
      { key: "empl_surname", label: "Прізвище" },
      { key: "empl_name", label: "Ім'я" },
      { key: "empl_role", label: "Роль" },
      { key: "salary", label: "Зарплата" },
      { key: "date_of_birth", label: "Дата народження" },
      { key: "date_of_start", label: "Дата початку" },
      { key: "phone_number", label: "Телефон" },
      { key: "city", label: "Місто" },
      { key: "street", label: "Вулиця" },
      { key: "zip_code", label: "ZIP" },
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
          return `/api/store-products`;
        },
      },
      {
        label: "Сортувати за",
        type: "sort",
        dependsOn: "Тип товару",
        dependsOnValues: ["prom", "notprom"],
        options: [
          { value: "name", label: "Назва" },
          { value: "quantity", label: "Кількість" },
        ],
      },
      {
        label: "Пошук за UPC",
        type: "search",
        buildUrl: (value) => value
          ? `/api/store-products/by-upc?upc=${encodeURIComponent(value)}`
          : null,
        searchColumns: [
          { key: "UPC", label: "UPC" },
          { key: "SELLING_PRICE", label: "Ціна" },
          { key: "PRODUCTS_NUMBER", label: "Кількість" },
          { key: "PRODUCT_NAME", label: "Назва" },
          { key: "CHARACTERISTICS", label: "Характеристики" },
        ],
      },
    ],
    columns: [
      { key: "upc", label: "UPC" },
      { key: "upc_prom", label: "Акційний UPC" },
      { key: "id_product", label: "Назва", foreignKey: { url: "/api/products", valueKey: "id_product", labelKey: "product_name" } },
      { key: "selling_price", label: "Ціна" },
      { key: "products_number", label: "Кількість" },
    ],
  },
  checks: {
    label: "Чеки",
    url: "/api/checks/all",
    columns: [
      { key: "check_number", label: "Номер чеку" },
      { key: "id_employee", label: "Касир" },
      { key: "card_number", label: "Картка" },
      { key: "print_date", label: "Дата" },
      { key: "sum_total", label: "Сума (₴)" },
      { key: "vat", label: "ПДВ (₴)" },
    ],
  },
  customerCard: {
    label: "Клієнти",
    url: "/api/customer-cards",
    canAdd: true, canDelete: true, canEdit: true,

    columns: [
      { key: "card_number", label: "card_number" },
      { key: "cust_surname", label: "cust_surname" },
      { key: "cust_name", label: "cust_name" },
      { key: "cust_patronymic", label: "cust_patronymic" },
      { key: "phone_number", label: "phone_number" },
      { key: "city", label: "city" },
      { key: "street", label: "street" },
      { key: "zip_code", label: "zip_code" },
      { key: "percent", label: "percent" },
    ],
  },
  stats: {
    label: "★",
    url: null,
    canAdd: false, canDelete: false, canEdit: false,
    columns: [],
  },
};
const EMPLOYEE_FILTERS = [
  { label: "Всі працівники", url: "/api/employees" },
  { label: "Касири", url: "/api/employees/cashiers" },
];

function EmployeeFilterBar({ activeUrl, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
      {EMPLOYEE_FILTERS.map(f => {
        const active = activeUrl === f.url;
        return (
          <button
            key={f.url}
            onClick={() => onChange(f.url)}
            style={{
          padding: "6px 16px",
          borderRadius: 8,
          border: "0.5px solid #ccc",
          background: activeUrl === f.url ? "#f0f0f0" : "transparent",
          cursor: "pointer",
          fontWeight: activeUrl === f.url ? 500 : 400,
        }}>
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ManagerPage({ logout }) {
  const [activeView, setActiveView] = useState("categories");
  const [data, setData] = useState([]);
  const [filterValues, setFilterValues] = useState({});
  const [resetKey, setResetKey] = useState(0);
  const [activeColumns, setActiveColumns] = useState(null);
  const [employeeUrl, setEmployeeUrl] = useState(EMPLOYEE_FILTERS[0].url);

  const view = VIEW_CONFIG[activeView];

  const loadData = (overrideUrl) => {
    if (activeView === "checks") return;
    const url = overrideUrl ?? (activeView === "employee" ? employeeUrl : view.url);
    fetch(url)
      .then(res => res.ok ? res.json() : [])
      .then(d => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]));
  };

  useEffect(() => {
    setFilterValues({});
    setActiveColumns(null);
    setEmployeeUrl(EMPLOYEE_FILTERS[0].url);
    if (activeView !== "checks") loadData();
  }, [activeView]);

  useEffect(() => {
    if (activeView === "employee") loadData(employeeUrl);
  }, [employeeUrl]);

  const handleAdd = (newRow) => {
    const rowWithPromo = {
      ...newRow,
      id_product: newRow.id_product ? Number(newRow.id_product) : null,
      selling_price: newRow.selling_price ? Number(newRow.selling_price) : null,
      products_number: newRow.products_number ? Number(newRow.products_number) : null,
      promotional: !!newRow.upc_prom && newRow.upc_prom.trim() !== "",
      upc_prom: newRow.upc_prom?.trim() || null,
    };

    fetch(view.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rowWithPromo),
    }).then(res => {
      if (!res.ok) res.text().then(msg => alert(msg)); // побачиш точне повідомлення
      else loadData();
    });
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
    if (!currentView.filters) { loadData(); return; }

    if (filter.type === "search") {
      const url = filter.buildUrl(value);
      if (url === null) {
        setActiveColumns(null);
        loadData();
      } else {
        if (filter.searchColumns) setActiveColumns(filter.searchColumns);
        loadData(url);
      }
      return;
    }
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

  const handleReset = () => {
    setFilterValues({});
    setActiveColumns(null);
    setResetKey(k => k + 1);
    loadData();
  };

  return (
    <div style={{ maxWidth: 960, margin: "2rem auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Manager Panel</h1>
        <button onClick={logout} style={{ padding: "5px 14px", borderRadius: 6, border: "0.5px solid #ccc", background: "transparent", cursor: "pointer", fontSize: 13 }}>
          Вийти
        </button>
      </div>

      <TabSwitcher views={VIEWS} activeView={activeView} onChange={setActiveView} config={VIEW_CONFIG} />

      {activeView === "checks" ? (
        <>
          <Mchecksview />
          <PrintPanel
            url={VIEW_CONFIG.checks.url}
            columns={VIEW_CONFIG.checks.columns}
            title={VIEW_CONFIG.checks.label}
          />
        </>
      ) : (
        <>
          {activeView === "employee" && (
            <EmployeeFilterBar
              activeUrl={employeeUrl}
              onChange={setEmployeeUrl}
            />
          )}

          {view.filters && (
            <FilterBar
              key={resetKey}
              filters={view.filters}
              values={filterValues}
              onChange={handleFilterChange}
              onReset={handleReset}
            />
          )}

          {activeView === "stats"
            ? <StatsPage />
            : (
              <>
                <UniversalTable
                  columns={activeColumns ?? view.columns}
                  data={data}
                  onAdd={activeColumns ? undefined : view.canAdd ? handleAdd : undefined}
                  onDelete={activeColumns ? undefined : view.canDelete ? handleDelete : undefined}
                  onEdit={activeColumns ? undefined : view.canEdit ? handleEdit : undefined}
                />
                <PrintPanel
                  url={activeView === "employee" ? employeeUrl : view.url}
                  columns={view.columns}
                  title={view.label}
                />
              </>
            )
          }
        </>
      )}
    </div>
  );
}