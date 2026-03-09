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
            if (fs.statSync(file).isDirectory()) {
                walk(file, function (err, res) { next(); });
            } else {
                if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                    let content = fs.readFileSync(file, 'utf8');
                    let updated = content;

                    // Revert all to text-white temporarily
                    updated = updated.replace(/text-text-on-brand/g, 'text-white');

                    // Re-apply smarter fixes
                    // If the element has bg-brand-primary, bg-danger, bg-success, etc, it should keep text-white
                    // Actually, Tailwind compiles text-white seamlessly. I shouldn't have changed text-white to text-text-on-brand globally, because text-white is purely #ffffff which is exactly what text-on-brand is. 
                    // The issue is, in light mode, text-white is invisible if the background is light.
                    // If the original author used text-white on a dark background card, we should use text-text-primary instead.
                    // Let's replace standalone text-white with text-text-primary.
                    // But if it's accompanied by bg-brand, bg-danger, bg-success, bg-color-info, bg-neutral, keep text-white.

                    // To do this reliably with regex is hard. Let's just do:
                    // 1. replace all text-white with text-text-primary
                    updated = updated.replace(/\btext-white\b/g, 'text-text-primary');

                    // 2. fix specific button combinations back to text-white
                    updated = updated.replace(/bg-brand-primary(.*?)\btext-text-primary\b/g, 'bg-brand-primary$1text-white');
                    updated = updated.replace(/bg-brand-primary-hover(.*?)\btext-text-primary\b/g, 'bg-brand-primary-hover$1text-white');
                    updated = updated.replace(/bg-danger(.*?)\btext-text-primary\b/g, 'bg-danger$1text-white');
                    updated = updated.replace(/bg-success(.*?)\btext-text-primary\b/g, 'bg-success$1text-white');
                    updated = updated.replace(/bg-color-info(.*?)\btext-text-primary\b/g, 'bg-color-info$1text-white');
                    updated = updated.replace(/bg-color-success(.*?)\btext-text-primary\b/g, 'bg-color-success$1text-white');
                    updated = updated.replace(/bg-color-danger(.*?)\btext-text-primary\b/g, 'bg-color-danger$1text-white');

                    if (content !== updated) {
                        fs.writeFileSync(file, updated, 'utf8');
                    }
                }
                next();
            }
        })();
    });
}

walk(path.join(__dirname, 'src'), function (err) {
    if (err) throw err;
    console.log('Fixed colors.');
});
