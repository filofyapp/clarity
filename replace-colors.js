// replace-colors.js
const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdir(dir, function (err, list) {
        if (err) return callback(err);
        let i = 0;
        (function next() {
            let file = list[i++];
            if (!file) return callback(null);
            file = path.join(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        next();
                    });
                } else {
                    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                        let content = fs.readFileSync(file, 'utf8');
                        let updated = content;

                        // First, process hover:text-white specific overrides -> hover:text-text-primary
                        updated = updated.replace(/hover:text-white/g, 'hover:text-text-primary');
                        // Then do rest text-white -> text-text-on-brand
                        updated = updated.replace(/text-white/g, 'text-text-on-brand');

                        if (content !== updated) {
                            fs.writeFileSync(file, updated, 'utf8');
                            console.log('Updated: ' + file);
                        }
                    }
                    next();
                }
            });
        })();
    });
}

walk(path.join(__dirname, 'src'), function (err) {
    if (err) throw err;
    console.log('Replacement complete.');
});
