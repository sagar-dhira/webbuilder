import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";

export default function TableElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { tableHeaders?: string; tableRows?: string };
  const headersText = content.tableHeaders ?? "Col1, Col2, Col3";
  const rowsText = content.tableRows ?? "A1, A2, A3\nB1, B2, B3";
  const headers = headersText.split(",").map((s) => s.trim()).filter(Boolean);
  const rows = rowsText.split("\n").map((line) => line.split(",").map((s) => s.trim()));

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full overflow-x-auto">
      <table style={element.styles} className="w-full border-collapse border border-border text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border border-border px-3 py-2 text-left font-medium bg-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border border-border px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ElementWrapper>
  );
}
