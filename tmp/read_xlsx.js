/**
 * Read DatosMigracion.xlsx and output headers + first 5 rows for analysis.
 */
const XLSX = require('xlsx');
const path = require('path');

const workbook = XLSX.readFile(path.join(__dirname, '..', 'DatosMigracion.xlsx'));

console.log('Sheets:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    console.log(`\n═══════════════════════════════════════`);
    console.log(`Sheet: ${sheetName}`);
    console.log(`═══════════════════════════════════════`);

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    console.log(`Total rows: ${data.length}`);

    if (data.length > 0) {
        console.log('\nHeaders:');
        Object.keys(data[0]).forEach((h, i) => {
            console.log(`  [${i}] "${h}"`);
        });

        console.log('\nFirst 5 rows:');
        data.slice(0, 5).forEach((row, i) => {
            console.log(`\n--- Row ${i + 1} ---`);
            Object.entries(row).forEach(([key, val]) => {
                if (val !== '' && val !== null && val !== undefined) {
                    console.log(`  ${key}: ${val}`);
                }
            });
        });

        // Also show last 2 rows
        console.log('\nLast 2 rows:');
        data.slice(-2).forEach((row, i) => {
            console.log(`\n--- Row ${data.length - 1 + i} ---`);
            Object.entries(row).forEach(([key, val]) => {
                if (val !== '' && val !== null && val !== undefined) {
                    console.log(`  ${key}: ${val}`);
                }
            });
        });

        // Show unique values for key columns
        const peritoCalle = [...new Set(data.map(r => r['PERITO DE CALLE'] || r['Perito de Calle'] || r['PERITO CALLE'] || '').filter(Boolean))];
        const peritoCarga = [...new Set(data.map(r => r['PERITO DE CARGA'] || r['Perito de Carga'] || r['PERITO CARGA'] || '').filter(Boolean))];
        const tipoIP = [...new Set(data.map(r => r['TIPO DE IP'] || r['Tipo de IP'] || r['TIPO IP'] || '').filter(Boolean))];
        const estados = [...new Set(data.map(r => r['ESTADO'] || r['Estado'] || '').filter(Boolean))];

        if (peritoCalle.length) console.log('\nPeritos Calle únicos:', peritoCalle);
        if (peritoCarga.length) console.log('Peritos Carga únicos:', peritoCarga);
        if (tipoIP.length) console.log('Tipos IP únicos:', tipoIP);
        if (estados.length) console.log('Estados únicos:', estados);
    }
});
