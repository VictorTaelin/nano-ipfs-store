var sha256 = require("nano-sha256");
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var IPFS = require("./nano-ipfs-store");

module.exports = IPFS({
  sha256: sha256,
  XMLHttpRequest: XMLHttpRequest
});

