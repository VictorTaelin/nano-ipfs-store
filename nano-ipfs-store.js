module.exports = function (imports) {
  var sha256 = imports.sha256;
  var XMLHttpRequest = imports.XMLHttpRequest;

  function at(url) {
    var requestBase = String(url+"/api/v0");

    // (Uint8Array | String) -> String
    function bytesToString(bytes) {
      if (typeof bytes === "string") {
        return bytes;
      } else {
        var str = "";
        for (var i = 0; i < bytes.length; ++i) {
          str += String.fromCharCode(bytes[i]);
        }
        return str;
      }
    }

    // String -> Uint8Array
    function stringToBytes(string) {
      var bytes = new Uint8Array(string.length);
      for (var i = 0; i < string.length; ++i) {
        bytes[i] = string.charCodeAt(i);
      }
      return bytes;
    }

    // Uint8Array -> String
    var toBase58 = (function() {
      var ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      return function(buffer) {
        if (buffer.length === 0) {
          return "";
        }
        var digits = [0];
        var i = 0;
        while (i < buffer.length) {
          var j = 0;
          var carry = 0;
          while (j < digits.length) {
            digits[j] <<= 8;
            j++;
          }
          digits[0] += buffer[i];
          j = 0;
          while (j < digits.length) {
            digits[j] += carry;
            carry = (digits[j] / 58) | 0;
            digits[j] %= 58;
            ++j;
          }
          while (carry) {
            digits.push(carry % 58);
            carry = (carry / 58) | 0;
          }
          i++;
        }
        i = 0;
        while (buffer[i] === 0 && i < buffer.length - 1) {
          digits.push(0);
          i++;
        }
        return digits.reverse().map(function(digit) {
          return ALPHABET[digit];
        }).join("");
      };
    })();

    function sendAsync(opts, cb) {
      var request = new XMLHttpRequest(); // eslint-disable-line
      var options = opts || {};
      var callback = cb || function emptyCallback() {};

      request.onreadystatechange = function() {
        if (request.readyState === 4 && request.timeout !== 1) {
          if (request.status !== 200) {
            callback(new Error("[ipfs-mini] status "+request.status+": "+request.responseText), null);
          } else {
            try {
              callback(null, (options.jsonParse ? JSON.parse(request.responseText) : request.responseText));
            } catch (jsonError) {
              callback(new Error("IPFS error"));
            }
          }
        }
      };

      request.open(options.payload ? "POST" : "GET", requestBase + opts.uri);

      if (options.accept) {
        request.setRequestHeader('accept', options.accept);
      }

      if (options.payload && options.boundary) {
        request.setRequestHeader('Content-Type', "multipart/form-data; boundary="+options.boundary);
        request.send(options.payload);
      } else {
        request.send();
      }
    }

    function createBoundary(data) {
      while (true) {
        var boundary = "----IPFSMini"+(Math.random() * 100000)+"."+(Math.random() * 100000);
        if (data.indexOf(boundary) === -1) {
          return boundary;
        }
      }
    }

    // (Uint8Array | String) -> CID
    function add(bytes) {
      var string = bytesToString(bytes);
      return new Promise(function(resolve, reject) {
        var boundary = createBoundary(string);
        var payload = "--"+boundary+'\r\nContent-Disposition: form-data; name="path"\r\nContent-Type: application/octet-stream\r\n\r\n'+string+"\r\n--"+boundary+"--";
        sendAsync({
          jsonParse: true,
          accept: 'application/json',
          uri: '/add?raw-leaves=true&pin=true',
          payload: payload,
          boundary: boundary
        }, function(err, result) {
          err ? reject(err) : resolve(result.Hash);
        });
      });
    }

    // CID -> Promise Uint8Array
    function get(ipfsHash) {
      return cat(ipfsHash).then(stringToBytes);
    }

    // CID -> Promise String
    function cat(ipfsHash) {
      return new Promise(function(resolve, reject) {
        sendAsync({uri: "/cat/"+ipfsHash}, function(err, res) {
          err ? reject(err) : resolve(res)
        });
      });
    }

    // HexString -> Promise CID
    function cid(bytes) {
      return sha256(bytesToString(bytes)).then(function(hash) { 
        var hex = "01551220" + hash;
        var bytes = new Uint8Array(hex.length / 2);
        for (var i = 0; i < hex.length; i += 2) {
          bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
        }
        return "z" + toBase58(bytes);
      });
    }

    return {
      add: add,
      get: get,
      cid: cid,
      cat: cat
    };
  };

  return {at: at};
};
