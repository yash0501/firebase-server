const functions = require("firebase-functions");
const express = require("express");
const admin = require("firebase-admin");
const app = express();
const cors = require("cors");
const { Buffer } = require("buffer");
const { InMemorySigner } = require("@taquito/signer");
const {
  char2Bytes,
  bytes2Char,
  verifySignature,
  validateSignature,
  buf2hex,
} = require("@taquito/utils");
const { TezosToolkit } = require("@taquito/taquito");

const signer = new InMemorySigner(
  "edskRneBSS17e9BX3tMf7PbdcmDwuPJJAcpGYz3F1NvUVvzJYpWHBBdACiW4hR1U5PQSFAxjFbjED5njLoRkqYxjL5hhFa1o9n"
);

admin.initializeApp();
app.use(cors({ origin: true }));

app.get("/", (req, res) => {
  res.send("Hello World Firebase");
});

app.post("/post", (req, res) => {
  const data = req.body;
  res.status(200).json({
    message: "Data received",
    data: data,
  });
});

app.post("/create_sign", async (req, res) => {
  const { address, amount, token_id } = req.body;
  const param_str = `${address}|${amount}|${token_id}`;
  console.log(param_str);
  // string to bytes
  const bytes = char2Bytes(param_str);
  // buffer to bytes
  const bufbytes = buf2hex(Buffer(param_str, "utf8"));
  console.log(bufbytes);

  console.log(bytes);
  const signature = await signer.sign(bytes);
  const pk = await signer.publicKey();
  console.log(pk);
  console.log(signature);
  // verify signature

  const isValid = await verifySignature(bytes, pk, signature.sig);

  console.log(isValid);

  res.status(200).json({
    message: "Signature created",
    signature: signature,
  });
});

exports.widgets = functions.https.onRequest(app);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
