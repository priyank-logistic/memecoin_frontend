const jwt = require("jwt-simple")

const encodeData = data => jwt.encode(data, "siddaganga_fleet")

const decodeData = encryptedData => jwt.decode(encryptedData, "siddaganga_fleet")

export { encodeData, decodeData }
