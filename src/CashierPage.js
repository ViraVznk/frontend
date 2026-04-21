import { useEffect, useState } from "react";
import { UniversalTable, TabSwitcher, FilterBar } from "./TableComponents";
import ChecksView from "./ChecksView";

const VIEWS = ["categories", "products", "storeProduct", "check", "customerCard"];

const VIEW_CONFIG = {
  categories: {
    label: "Категорії",
    url: "/api/categories",
    canAdd: false, canDelete: false, canEdit: false,
    columns: [
      { key: "category_number", label: "ID" },
      { key: "category_name", label: "Назва" },
    ],
  },
  products: {
    label: "Товари",
    url: "/api/products",
    canAdd: false, canDelete: false, canEdit: false,
    filters: [{
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
  storeProduct: {
    label: "Товари в магазині",
    url: "/api/store-products",
    canAdd: false, canDelete: false, canEdit: false,
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
      {
        label: "Пошук за UPC",
        type: "search",
        buildUrl: (value) => value
          ? `/api/store-products/by-upc-def?upc=${encodeURIComponent(value)}`
          : "/api/store-products",
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
  customerCard:{
    label: "Клієнти",
    url: "/api/customer-cards",
    canAdd: true, canDelete: false, canEdit: true,
    columns: 
    [{ key: "card_number", label: "card_number" },
    { key: "cust_surname", label: "cust_surname" },
    { key: "cust_name", label: "cust_name" },
    { key: "cust_patronymic", label: "cust_patronymic" },
    { key: "phone_number", label: "phone_number" },
    { key: "city", label: "city" },
    { key: "street", label: "street" },
    { key: "zip_code", label: "zip_code" },
    { key: "percent", label: "percent" },
    ],
    filters: [
      {
        label: "Пошук за прізвищем",
        type: "search",
        buildUrl: (value) => value ? `/api/customer-cards/by-surname?surname=${encodeURIComponent(value)}` : `/api/customer-cards`,
      }
    ],
  },
};

const EMPLOYEE_FIELD_LABELS = {
  id_employee: "ID",
  empl_surname: "Прізвище",
  empl_name: "Ім'я",
  empl_patronymic: "По батькові",
  empl_role: "Роль",
  salary: "Зарплата",
  date_of_birth: "Дата народження",
  date_of_start: "Дата початку роботи",
  phone_number: "Телефон",
  city: "Місто",
  street: "Вулиця",
  zip_code: "ZIP-код",
};

function EmployeeProfileModal({ employee, onClose }) {
  if (!employee) return null;

  const initials = [employee.empl_name?.[0], employee.empl_surname?.[0]]
    .filter(Boolean).join("").toUpperCase();

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 160,
        background: "#fbddee",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "0.7px solid #de97c0",
         boxShadow: "0 4px 12px rgba(255, 167, 246, 0.31)",
        borderRadius: 8,
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--color-background-primary)",
          borderRadius: "var(--border-radius-lg)",
          border: "0.5px solid var(--color-border-tertiary)",
          padding: "1.5rem",
          minWidth: 340,
          maxWidth: 460,
          width: "50%",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 12,
            background: "transparent",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-md)",
            width: 28, height: 28,
            cursor: "pointer",
            fontSize: 14,
            color: "var(--color-text-secondary)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label="Закрити"
        >✕</button>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "var(--color-background-info)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 500, fontSize: 16,
            color: "var(--color-text-info)",
            flexShrink: 0,
          }}>
            {initials || "?"}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 500, fontSize: 16, color: "var(--color-text-primary)" }}>
              {[employee.empl_surname, employee.empl_name, employee.empl_patronymic].filter(Boolean).join(" ")}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
              {employee.empl_role}
            </p>
          </div>
        </div>

        {/* Info table */}
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 14 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {Object.entries(EMPLOYEE_FIELD_LABELS)
                .filter(([key]) => !["empl_surname", "empl_name", "empl_patronymic", "empl_role"].includes(key))
                .map(([key, label]) => (
                  <tr key={key}>
                    <td style={{ color: "var(--color-text-secondary)", padding: "5px 0", width: "45%" }}>{label}</td>
                    <td style={{ color: "var(--color-text-primary)", padding: "5px 0", textAlign: "right" }}>
                      {employee[key] ?? "—"}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CashierPage({ logout, employeeId }) {
  const [activeView, setActiveView] = useState("categories");
  const [data, setData] = useState([]);
  const [filterValues, setFilterValues] = useState({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [selfInfo, setSelfInfo] = useState(null);
  const [selfLoading, setSelfLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const view = VIEW_CONFIG[activeView];

  useEffect(() => {
    if (!employeeId) return;
    setSelfLoading(true);
    fetch(`/api/employees/${employeeId}`)
      .then(res => res.ok ? res.json() : null)
      .then(d => setSelfInfo(d))
      .catch(() => setSelfInfo(null))
      .finally(() => setSelfLoading(false));
  }, [employeeId]);

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

  const handleReset = () => {
    setFilterValues({});
    setResetKey(k => k + 1);
    loadData();
  };

  const tabConfig = { ...VIEW_CONFIG, check: { label: "Чеки" } };

  const displayName = selfInfo
    ? [selfInfo.empl_name, selfInfo.empl_surname].filter(Boolean).join(" ")
    : selfLoading ? "…" : employeeId;

  return (
    <div style={{ maxWidth: 960, margin: "2rem auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Cashier Panel</h1>

        {/* Right side: name button + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setProfileOpen(true)}
            title="Переглянути мою інформацію"
            style={{
              padding: "5px 14px",
              borderRadius: 6,
              border: "0.5px solid var(--color-border-secondary)",
              background: "var(--color-background-secondary)",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--color-text-primary)",
              fontWeight: 400,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.65 }}>
              <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
              <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {displayName}
          </button>

          <button
            onClick={logout}
            style={{
              padding: "5px 14px",
              borderRadius: 6,
              border: "0.5px solid #de97c0",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
              color: "#383838",
            }}
          >
            Вийти
          </button>
        </div>
      </div>

      <TabSwitcher views={VIEWS} activeView={activeView} onChange={setActiveView} config={tabConfig} />

      {activeView === "check" ? (
        <ChecksView employeeId={employeeId} canDelete={true} canAdd={true} />
      ) : (
        <>
          {view?.filters && (
            <FilterBar
              key={resetKey}
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

      {/* Self-profile modal */}
      {profileOpen && (
        <EmployeeProfileModal
          employee={selfInfo}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </div>
  );
}