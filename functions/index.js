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
const { TezosToolkit, RpcPacker } = require("@taquito/taquito");
const {
  Parser,
  packDataBytes,
  MichelsonData,
  MichelsonType,
} = require("@taquito/michel-codec");

const Signer = new InMemorySigner(
  "edskRneBSS17e9BX3tMf7PbdcmDwuPJJAcpGYz3F1NvUVvzJYpWHBBdACiW4hR1U5PQSFAxjFbjED5njLoRkqYxjL5hhFa1o9n"
);

const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tantest-35456-default-rtdb.firebaseio.com",
});

const tezos = new TezosToolkit("https://ithacanet.smartpy.io/").setProvider({
  signer: Signer,
});

const db = admin.database();

app.use(cors({ origin: true }));

app.get("/", (req, res) => {
  res.send("Hello World Firebase");
});

app.post("/create_sign", async (req, res) => {
  const { userid, address, amount, token_id } = req.body;

  const data = `(Pair (Pair "${address}" ${amount}) ${token_id})`;
  const type = `(pair (pair (address) (nat)) (nat))`;

  const p = new Parser();
  const dataJSON = p.parseMichelineExpression(data);
  const typeJSON = p.parseMichelineExpression(type);

  const packed = packDataBytes(dataJSON, typeJSON);
  console.log(packed);

  const signature = await Signer.sign(packed.bytes);
  console.log(signature);

  // res.status(200).json({
  //   message: "Signature created",
  //   signature: signature,
  // });

  const userRef = db.ref("users/");
  const newUserRef = userRef.push();
  newUserRef
    .set({
      userid: userid,
      address: address,
      signature: signature,
      amount: amount,
      token_id: token_id,
    })
    .then((result) => {
      console.log(result);
      res.status(200).json({
        message: "Signature created",
        signature: signature,
        result: result,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        message: "Error creating signature",
        error: error,
      });
    });
});

app.get("/get_sign", async (req, res) => {
  const { userid } = req.query;
  const userRef = db.ref("users/" + userid);
  userRef
    .once("value", (snapshot) => {
      const user = snapshot.val();
      console.log(user);
      res.status(200).json({
        message: "Signature retrieved",
        user: user,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({
        message: "Error retrieving signature",
        error: error,
      });
    });
});

exports.widgets = functions.https.onRequest(app);
