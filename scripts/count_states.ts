import * as xlsx from 'xlsx';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'DatosMigracion.xlsx');
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json<any>(sheet, { header: 1 });
const dataRows = rows.slice(1).filter(r => r && r.length > 2);

const counts = new Map<string, number>();

for (const row of dataRows) {
    let rawEstado = String(row[4]).trim().toUpperCase();
    counts.set(rawEstado, (counts.get(rawEstado) || 0) + 1);
}

console.log("Conteo de estados RAW en Excel:");
for (const [estado, count] of counts.entries()) {
    console.log(`- ${estado}: ${count}`);
}
