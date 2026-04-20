import { useRef, useEffect, useState } from "react";
import { useReactToPrint } from "react-to-print";

export function PrintPanel({ url, columns, title }) { 
  const contentRef = useRef(null);
  const [printData, setPrintData] = useState([]);

  useEffect(() => {
    fetch(url)
      .then(res => res.ok ? res.json() : [])
      .then(d => setPrintData(Array.isArray(d) ? d : []))
      .catch(() => setPrintData([]));
  }, [url]);

  const reactToPrintFn = useReactToPrint({ contentRef });

  return (
    <div>
      <button onClick={reactToPrintFn} style={{
        marginTop: "1rem", padding: "6px 16px", borderRadius: 8,
        border: "0.5px solid #ccc", cursor: "pointer",
        background: "transparent", fontSize: 13,
      }}>
        print
      </button>

      <div ref={contentRef} style={{ display: "none" }}>
        <style>{`
          @media print {
            div { display: block !important; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
            //th { background: #f0f0f0; }
            h2 { margin-bottom: 1rem; }
          }
        `}</style>
        <h2>{title}</h2>
        <table>
          <thead>
            <tr>{columns.map(col => <th key={col.key}>{col.label}</th>)}</tr>
          </thead>
          <tbody>
            {printData.map((row, i) => (
              <tr key={i}>
                {columns.map(col => <td key={col.key}>{row[col.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}