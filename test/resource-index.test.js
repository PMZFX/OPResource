'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { createResourcePathChecker, filterResourceIndex } = require('../lib/resource-index');

test('filters only entries whose paths cannot be served', () => {
    const source = [
        '#resources=[',
        '  |definitionProperties=[',
        '    |path=$lang0000/definitionProperties/00000016.txt',
        '  ]',
        '  |gfx_scarab_v2=[',
        '    |path=$lang0000/gfx/scarab_v2/00000000.a3m',
        '  ]',
        ']#date=$2024-03-06-00-00-00',
    ].join('\n');

    const result = filterResourceIndex(source, resourcePath => resourcePath.endsWith('.txt'));

    assert.match(result.text, /definitionProperties/);
    assert.doesNotMatch(result.text, /gfx_scarab_v2/);
    assert.match(result.text, /#date=\$2024-03-06/);
    assert.deepEqual(result.removed, [{
        name: 'gfx_scarab_v2',
        path: 'lang0000/gfx/scarab_v2/00000000.a3m',
    }]);
});

test('path checker accepts files, icon fallback, and generated terrain only', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opresource-index-'));
    const layers = fs.mkdtempSync(path.join(os.tmpdir(), 'opresource-layers-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    t.after(() => fs.rmSync(layers, { recursive: true, force: true }));
    fs.mkdirSync(path.join(root, 'lang0000', 'definitionProperties'), { recursive: true });
    fs.writeFileSync(path.join(root, 'lang0000', 'definitionProperties', '00000016.txt'), 'ok');
    fs.writeFileSync(path.join(layers, 'blocks.0137.bin'), 'terrain');

    const canServe = createResourcePathChecker({ resourceRoot: root, layersRoot: layers });

    assert.equal(canServe('lang0000/definitionProperties/00000016.txt'), true);
    assert.equal(canServe('lang0000/icons/missing/00000000.png'), true);
    assert.equal(canServe('lang0000/layers/0137/blocks0137/00000001.dat'), true);
    assert.equal(canServe('lang0000/layers/0137/plants0137/00000001.dat'), false);
    assert.equal(canServe('lang0000/gfx/scarab_v2/00000000.a3m'), false);
});
