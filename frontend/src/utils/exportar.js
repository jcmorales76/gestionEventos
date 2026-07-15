import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Exporta un array de objetos a un archivo .xlsx
export function exportarExcel(filas, nombreArchivo, hoja = "Datos") {
  const ws = XLSX.utils.json_to_sheet(filas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, hoja);
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
}

// Exporta una tabla a PDF (columnas = array de títulos, filas = array de arrays)
export function exportarPDF({
  titulo,
  subtitulo,
  columnas,
  filas,
  nombreArchivo,
  orientacion = "portrait",
}) {
  const doc = new jsPDF({ orientation: orientacion });
  doc.setFontSize(14);
  doc.text(titulo, 14, 16);
  let startY = 22;
  if (subtitulo) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(subtitulo, 14, 22);
    doc.setTextColor(0);
    startY = 28;
  }
  autoTable(doc, {
    head: [columnas],
    body: filas,
    startY,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [220, 38, 38] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  doc.save(`${nombreArchivo}.pdf`);
}
