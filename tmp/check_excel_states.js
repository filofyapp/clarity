const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "DatosMigracion.xlsx");
if (fs.existsSync(filePath)) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const estados = {};
    data.forEach(row => {
        const e = (row['ESTADO'] || 'vacio').toString().toUpperCase();
        estados[e] = (estados[e] || 0) + 1;
    });
    console.log("Estados en Excel:", estados);
} else {
    console.log("File not found");
}
