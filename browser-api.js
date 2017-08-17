var sha256 = require("nano-sha256");
var XMLHttpRequest = window.XMLHttpRequest;
var IPFS = require("./nano-ipfs-store");

module.exports = IPFS({
  sha256: sha256,
  XMLHttpRequest: XMLHttpRequest
});

