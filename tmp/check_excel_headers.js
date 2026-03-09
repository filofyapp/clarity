const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "DatosMigracion.xlsx");
if (fs.existsSync(filePath)) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log("Headers:");
    console.log(data[0]);
} else {
    console.log("File not found");
}
