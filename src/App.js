import { useEffect, useState } from "react";

function App() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/test")
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  return (
    <div>
      <h1>Products</h1>
      <ul>
        {products.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;