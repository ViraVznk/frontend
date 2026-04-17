import { useEffect, useState } from "react";

function App() {
  const [category, setProducts] = useState([]);
useEffect(() => {
  fetch("/api/categories")
    .then(res => res.json())
    .then(data => {
      console.log(data);
      setProducts(data);
    })
    .catch(console.error);
}, []);

 const categoryColumns = [
  { key: "CATEGORY_NUMBER", label: "ID" },
  { key: "CATEGORY_NAME", label: "Назва" }
];

  return (
    <div>
      <h1>categories</h1>
      <GenericTable data={category} columns={categoryColumns} />
    </div>
  );
}

function GenericTable({ data, columns }) {
  if (!data || data.length === 0) return <p>No data</p>;

  return (
    <table border="1">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map(col => (
              <td key={col.key}>
                {col.render
                  ? col.render(row[col.key], row)
                  : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default App;