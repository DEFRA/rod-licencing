const Path = require('path')
const root = Path.join(__dirname, '..')
const packageJson = require(Path.join(root, 'package.json'))
module.exports = { root, packageJson }
