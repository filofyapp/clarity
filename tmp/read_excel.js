const xlsx = require('xlsx');
const fs = require('fs');

const filePath = 'c:/Users/nicol/.gemini/antigravity/scratch/AOMNIS/PLANILLA SANCOR.xlsx';
if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    process.exit(1);
}

const workbook = xlsx.readFile(filePath);

// Inspect "General" sheet for 2026 data and structure
if (workbook.SheetNames.includes('General')) {
    const generalSheet = workbook.Sheets['General'];
    const generalData = xlsx.utils.sheet_to_json(generalSheet, { header: 1 });
    console.log(`\n--- Inspecting 'General' Sheet (rows 0-25) ---`);
    for (let i = 0; i < Math.min(25, generalData.length); i++) {
        console.log(`Row ${i}:`, generalData[i]);
    }
} else if (workbook.SheetNames.includes('GralEnero')) {
    const generalSheet = workbook.Sheets['GralEnero'];
    const generalData = xlsx.utils.sheet_to_json(generalSheet, { header: 1 });
    console.log(`\n--- Inspecting 'GralEnero' Sheet (rows 0-25) ---`);
    for (let i = 0; i < Math.min(25, generalData.length); i++) {
        console.log(`Row ${i}:`, generalData[i]);
    }
}

// Inspect "NOTOCAR" Sheet
if (workbook.SheetNames.includes('NOTOCAR')) {
    const noTocarSheet = workbook.Sheets['NOTOCAR'];
    const noTocarData = xlsx.utils.sheet_to_json(noTocarSheet, { header: 1 });
    console.log(`\n--- Data in 'NOTOCAR' ---`);
    console.log(noTocarData.slice(0, 50));
}
