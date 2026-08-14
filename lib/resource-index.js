'use strict';

const fs = require('fs');
const path = require('path');

function filterResourceIndex(source, isServable) {
    const newline = source.includes('\r\n') ? '\r\n' : '\n';
    const lines = source.split(/\r?\n/);
    const output = [];
    const removed = [];

    for (let index = 0; index < lines.length;) {
        const entry = lines[index].match(/^  \|([^=]+)=\[$/);
        if (!entry) {
            output.push(lines[index]);
            index += 1;
            continue;
        }

        const block = [lines[index]];
        index += 1;
        while (index < lines.length) {
            block.push(lines[index]);
            const complete = /^  \]$/.test(lines[index]);
            index += 1;
            if (complete) {
                break;
            }
        }

        const pathLine = block.find(line => /^    \|path=\$/.test(line));
        const resourcePath = pathLine ? pathLine.replace(/^    \|path=\$/, '') : null;
        if (resourcePath && !isServable(resourcePath)) {
            removed.push({ name: entry[1], path: resourcePath });
            continue;
        }

        output.push(...block);
    }

    return { text: output.join(newline), removed };
}

function createResourcePathChecker(options) {
    const resourceRoot = path.resolve(options.resourceRoot);
    const externalRoot = options.externalRoot ? path.resolve(options.externalRoot) : null;

    return resourcePath => {
        const normalized = resourcePath.replace(/^\/+/, '').replaceAll('/', path.sep);
        if (fs.existsSync(path.join(resourceRoot, normalized))) {
            return true;
        }

        const languageRelative = normalized.replace(/^lang0000[\\/]/, '');
        if (externalRoot && fs.existsSync(path.join(externalRoot, languageRelative))) {
            return true;
        }

        // Missing icons are intentionally served by OPResource's default PNG
        // fallback, and terrain chunks are synthesized from raw layer files.
        if (/\.png$/i.test(normalized)) {
            return true;
        }
        if (/^lang0000[\\/]layers[\\/]\d{4}[\\/](altitude|blocks|control|plants)\d{4}[\\/]\d{8}\.dat$/i.test(normalized)) {
            return true;
        }

        return false;
    };
}

module.exports = { createResourcePathChecker, filterResourceIndex };
