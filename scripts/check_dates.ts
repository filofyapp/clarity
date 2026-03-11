import * as xlsx from 'xlsx';
import * as path from 'path';

function excelDateToJSDate(serial: number) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
}

const filePath = path.join(process.cwd(), 'DatosMigracion.xlsx');
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json<any>(sheet, { header: 1 });
const dataRows = rows.slice(1).filter(r => r && r.length > 2);

console.log("Muestreo de fechas en el Excel:");
const recentRows = dataRows.slice(Math.max(dataRows.length - 20, 0)); // last 20 rows
for (const row of recentRows) {
    const rawIngreso = row[0];
    const siniestro = row[1];
    let parsedDate = 'INVALID';
    if (typeof rawIngreso === 'number') {
        parsedDate = excelDateToJSDate(rawIngreso);
    } else {
        parsedDate = String(rawIngreso);
    }
    console.log(`Siniestro: ${siniestro} | Ingreso Raw (Excel): ${rawIngreso} | Parseado: ${parsedDate}`);
}
