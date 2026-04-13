import { useEffect, useState } from "react";

function App() {
  useEffect(() => {
  fetch("/api/test")
    .then(res => res.text())
    .then(data => console.log(data));
    
}, []);
}

export default App;