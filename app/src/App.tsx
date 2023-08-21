import { useEthers, useLocalStorage } from "@usedapp/core";
import { Proof } from "circuits";
import { EdDSASignature } from "circuits/src/eddsa";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import "./App.css";
import Connect from "./components/Connect";
import GenZKP from "./components/GenZKP";
import SendTx from "./components/SendTx";
import SignEdDSA from "./components/SignEdDSA";
import Viewer from "./components/Viewer";
import useEdDSA from "./hooks/useEdDSA";
import Deploy from "./components/Deploy";

// const address = process.env["REACT_APP_CONTRACT_ADDRESS"] as string;
// if (typeof address !== "string") throw Error("Configure contract address");
const msgToSign = BigNumber.from("0x1234").toBigInt();

function App() {
  const { account } = useEthers();
  const privKey = account || undefined;
  const { pubKey } = useEdDSA(privKey);
  const [eddsaSignature, setEdDSASignature] = useState<EdDSASignature>();
  const [proof, setProof] = useState<Proof>();
  const [time, setTime] = useState<number>();
  return (
    <div className="App">
      <h2>Step 4. Prepare zkp signals</h2>
      <SignEdDSA
        privKey={privKey}
        message={msgToSign}
        onResult={(result) => setEdDSASignature(result)}
      />
      <h2>Step 5. Compute a zk proof</h2>
      <GenZKP
        message={msgToSign}
        pubKey={pubKey}
        signature={eddsaSignature}
        onResult={(result) => {
          console.log("proof:", result.proof);
          console.log("proving took", result.time, "ms");
          setProof(result.proof);
          setTime(result.time);
        }}
      />
      {time && (
        <div>
          <p>proving took {time} ms</p>
        </div>
      )}
    </div>
  );
}

export default App;
