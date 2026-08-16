export async function downloadExcel(
  filename: string,
  sheets: Array<{
    name: string;
    data: Array<Array<string | number | boolean | null>>;
    cols?: Array<{ wch?: number; width?: number; hidden?: boolean }>;
    styles?: Record<string, any>;
  }>
) {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.data);

    if (sheet.cols && sheet.cols.length) {
      worksheet['!cols'] = sheet.cols;
    }

    if (sheet.styles && typeof sheet.styles === 'object') {
      Object.entries(sheet.styles).forEach(([cellRef, style]) => {
        const cell = XLSX.utils.decode_cell(cellRef);
        const key = XLSX.utils.encode_cell(cell);
        const existing = worksheet[key] || { t: 'n', v: '' };
        worksheet[key] = { ...existing, s: style };
      });
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
