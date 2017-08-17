## nano-ipfs-store

Store strings/buffers on IPFS. 3.1K gzipped.

This is a fork of [ipfs-mini](https://github.com/SilentCicero/ipfs-mini), with some slight changes based on what I needed for a project.

## Methods

```javascript
ipfs.add : (Uint8Array | String) -> Promise CID // Uploads Uint8Array or String to IPFS
ipfs.get : CID -> Promise Uint8Array            // Gets Uint8Array from IPFS
ipfs.cat : CID -> Promise String                // Gets String from IPFS
ipfs.cid : (Uint8Array | String) -> Promise CID // Gets the CID without performing the upload
```

## Example

```javascript
const IPFS = require("nano-ipfs-store");
const ipfs = IPFS.at("https://ipfs.infura.io:5001");
const assert = require("assert");

(async () => {

  // Upload raw data
  const data1 = new Uint8Array([0,1,3,7,15,31,63,127,255]);
  const cid1 = await ipfs.add(data1);

  // Recover it from returned CID
  const data2 = await ipfs.get(cid1);
  assert(JSON.stringify(data1) === JSON.stringify(data2));

  // Generate CID without uploading
  const cid2 = await ipfs.cid(data1);
  assert(cid1 === cid2);

  // Upload string
  assert(await ipfs.cat(await ipfs.add("foobar")) === "foobar");

  console.log("ok");

})();
```

## A note

I'd just like to thank the guys behind IPFS and IPFS-mini, the hackers on IRC, but, in special, Kubuxu on #ipfs at freenode.net, who, at 5am, took some time to show me live how to find the CID of a blob. Thank you.
