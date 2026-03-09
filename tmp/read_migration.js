const xlsx = require('xlsx');
const fs = require('fs');

const filePath = 'c:/Users/nicol/.gemini/antigravity/scratch/AOMNIS/DatosMigracion.xlsx';
if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    process.exit(1);
}

const workbook = xlsx.readFile(filePath);
console.log("Sheet Names:", workbook.SheetNames);

for (const sheetName of workbook.SheetNames) {
    console.log(`\n--- Data in '${sheetName}' ---`);
    const sheet = workbook.Sheets[sheetName];
    // Read raw rows to see exactly how it looks
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Total rows: ${data.length}`);
    for (let i = 0; i < Math.min(25, data.length); i++) {
        console.log(`Row ${i}:`, data[i]);
    }
}
