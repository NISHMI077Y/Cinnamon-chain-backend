const crypto = require('crypto');

const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');

const sha256Buffer = (data) => crypto.createHash('sha256').update(data).digest();

module.exports = { sha256, sha256Buffer };