const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) {
        console.log('File not found:', filePath);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (let { search, replace } of replacements) {
        if (search instanceof RegExp) {
            content = content.replace(search, replace);
        } else {
            content = content.split(search).join(replace);
        }
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
}

// 1. manifest.json
replaceInFile('public/manifest.json', [
    { search: 'AOMNIS', replace: 'CLARITY' }
]);

// 2. layout.tsx
replaceInFile('src/app/layout.tsx', [
    { search: 'AOMNIS', replace: 'CLARITY' }
]);

// 3. Pages metadata
const pages = [
    'src/app/(dashboard)/dashboard/page.tsx',
    'src/app/(dashboard)/casos/page.tsx',
    'src/app/(dashboard)/casos/[id]/page.tsx',
    'src/app/(dashboard)/casos/nuevo/page.tsx',
    'src/app/(dashboard)/carga/page.tsx',
    'src/app/(dashboard)/mi-agenda/page.tsx',
    'src/app/(dashboard)/facturacion/page.tsx',
    'src/app/(dashboard)/configuracion/page.tsx',
    'src/app/(dashboard)/directorio/gestores/page.tsx',
    'src/app/(dashboard)/directorio/talleres/page.tsx',
    'src/app/(dashboard)/directorio/credenciales/page.tsx',
    'src/app/(dashboard)/directorio/valores/page.tsx',
    'src/app/(dashboard)/directorio/repuesteros/page.tsx'
];
for (let p of pages) {
    replaceInFile(p, [
        { search: 'AOMNIS', replace: 'CLARITY' }
    ]);
}

// Login
replaceInFile('src/app/(auth)/login/page.tsx', [
    { search: 'AOMNIS', replace: 'CLARITY' },
    { search: 'aomnis.test', replace: 'clarity.test' }
]);

// Components
replaceInFile('src/components/layout/SidebarClient.tsx', [
    { search: '<span className=\"font-extrabold text-sm\">AO</span>', replace: '<span className=\"font-extrabold text-sm\">CL</span>' },
    { search: 'AOMNIS', replace: 'CLARITY' }
]);
replaceInFile('src/components/layout/Topbar.tsx', [
    { search: 'AOMNIS', replace: 'CLARITY' }
]);
replaceInFile('src/lib/auth.ts', [
    { search: '@aomnis.com', replace: '@clarity.com' }
]);

replaceInFile('src/components/tareas/TareaCard.tsx', [
    { search: 'aomnis_task_panel_width', replace: 'clarity_task_panel_width' }
]);
replaceInFile('src/components/casos/CasosTable.tsx', [
    { search: 'aomnis_casos_layout', replace: 'clarity_casos_layout' }
]);
replaceInFile('src/components/casos/ParserIA.tsx', [
    { search: 'AOMNIS', replace: 'CLARITY' }
]);
replaceInFile('src/lib/parser/sancor.ts', [
    { search: 'AOMNIS', replace: 'CLARITY' }
]);

// Document references
replaceInFile('AOMNIS_DOC_TECNICA.md', [
    { search: 'AOMNIS', replace: 'CLARITY' }
]);
replaceInFile('AOMNIS_Hoja_de_Ruta.md', [
    { search: 'AOMNIS', replace: 'CLARITY' }
]);

console.log("Done");
