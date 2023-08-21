import { Proof } from "circuits";
import { EdDSASignature } from "circuits/src/eddsa";
import useCircuit from "../hooks/useCircuit";
import { useState } from "react";

function GenZKP({
  signature,
  message,
  pubKey,
  onResult,
}: {
  message: bigint;
  pubKey?: [bigint, bigint];
  signature?: EdDSASignature;
  onResult: ({ proof, time }: { proof: Proof; time: number }) => void;
}) {
  const { client } = useCircuit();
  const [proving, setProving] = useState(false);
  return (
    <div>
      <button
        // disabled={!client || !pubKey || !signature}
        disabled={!client}
        onClick={async () => {
          if (!client) alert("Client is not ready");
          // else if (!pubKey) alert("EdDSA pubkey is not ready");
          // else if (!signature) alert("EdDSA signature is not ready");
          else {
            console.log("sending prove request to worker");
            setProving(true);
            const start = performance.now();

            // dummy values
            const res = await client.prove({
              M: message,
              Ax: BigInt(0),
              Ay: BigInt(0),
              S: BigInt(0),
              R8x: client.babyjub.F.toObject(new Uint8Array(32)),
              R8y: client.babyjub.F.toObject(new Uint8Array(32)),
            });
            const end = performance.now();
            console.log("proof done");
            console.log("proving took", end - start, "ms");
            onResult({ proof: res, time: end - start });
          }
        }}
      >
        {proving ? "proving..." : "Create zkp"}
      </button>
    </div>
  );
}

export default GenZKP;
