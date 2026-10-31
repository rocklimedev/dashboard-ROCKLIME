const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createRequire } = require('node:module');
module.exports = function load(relative, stubs = {}) {
  const filename = path.resolve(__dirname, relative);
  const module = { exports: {} };
  const realRequire = createRequire(filename);
  const requireStub = (id) => (Object.hasOwn(stubs, id) ? stubs[id] : realRequire(id));
  vm.runInThisContext(
    `(function(require,module,exports,__dirname,__filename){${fs.readFileSync(filename, 'utf8')}\n})`,
    { filename },
  )(requireStub, module, module.exports, path.dirname(filename), filename);
  return module.exports;
};
