import buildCalculator from "../zk/circuits/main_js/witness_calculator";
import { buildBabyjub } from "circomlibjs";
import * as snarkjs from "snarkjs";

export interface Proof {
  a: [bigint, bigint];
  b: [[bigint, bigint], [bigint, bigint]];
  c: [bigint, bigint];
}

export class ZKPClient {
  private _calculator: any;
  private _babyjub: any;
  private _zkey: any;

  get initialized() {
    return (
      this._calculator !== undefined &&
      this._babyjub !== undefined &&
      this._zkey !== undefined
    );
  }

  get babyjub() {
    if (!this.initialized) throw Error("Not initialized");
    return this._babyjub;
  }

  get calculator() {
    if (!this.initialized) throw Error("Not initialized");
    return this._calculator;
  }

  async init(wasm: Buffer, zKey: Buffer) {
    if (this.initialized) return this;
    // you can adjust the file path here
    [this._zkey, this._calculator, this._babyjub] = await Promise.all([
      zKey,
      buildCalculator(wasm),
      buildBabyjub(),
    ]);
    this._zkey.type = "mem";
    return this;
  }

  /**
   * @dev customize this functions for your own circuit!
   */
  async prove({
    M,
    Ax,
    Ay,
    S,
    R8x,
    R8y,
  }: {
    M: bigint;
    Ax: bigint;
    Ay: bigint;
    S: bigint;
    R8x: bigint;
    R8y: bigint;
  }): Promise<Proof> {
    console.log("generating...");
    // const inputs = {
    //   M,
    //   Ax,
    //   Ay,
    //   S,
    //   R8x,
    //   R8y,
    // };
    // const inputs = {
    //   signature,
    //   modulus,
    //   base_message,
    // };

    // inputs from PCD
    const inputs = {
      signature: splitToWords(
        BigInt(
          "6102781901954910172771968626978079596102243599256398556324140785079911901716898415848846390562668159488183742623036654532141980541769773886553141292468415289723735095453488045306013916403286242714446330172495752876178976793630444903183756277424520560289151049557992422118958025832085608752355665064438866319342795191012539016153869076763016412619747972765935295890234746751573046960808451158966615208201877913575526730675967028580075965796393646332593395225234208930149794221257245491155140690069583340566029788639591611673530387880553686734496401108389513156936428339004788674978928904070798614638961127401778640940"
        ),
        BigInt(64),
        BigInt(32)
      ),
      modulus: splitToWords(
        BigInt(
          "19961177127210699861183155557396872203015332839844100034375294015088745428247304922217008144863784526066072651353970508943436953073020190269395299763952748501470957675258242931529035018492041725663758896783481385750102284220852980413692132008903719047442090695021615586210302090636556731728131647737207719590180641130862708225071236249277821570373849687045624472993348192409726558037204842277568975847783525254990484982885478518860892559454183025088047167509833375232306448087958176907779085285769454123738909609999340619291883731320053401016638422914099156706985484451567005458589915202709170498390936695910593598617"
        ),
        BigInt(64),
        BigInt(32)
      ),
      base_message: splitToWords(
        BigInt("703993777145756967576188115661016000849227759454"),
        BigInt(64),
        BigInt(32)
      ),
    };

    const wtns = await this.calculator.calculateWTNSBin(inputs, 0);
    const { proof } = await snarkjs.groth16.prove(this._zkey, wtns);
    console.log("proof:", proof);
    return {
      a: [proof.pi_a[0], proof.pi_a[1]] as [bigint, bigint],
      b: [proof.pi_b[0].reverse(), proof.pi_b[1].reverse()] as [
        [bigint, bigint],
        [bigint, bigint]
      ],
      c: [proof.pi_c[0], proof.pi_c[1]] as [bigint, bigint],
    };
  }
}

export function splitToWords(
  number: bigint,
  wordsize: bigint,
  numberElement: bigint
) {
  let t = number;
  const words: string[] = [];
  for (let i = BigInt(0); i < numberElement; ++i) {
    const baseTwo = BigInt(2);

    words.push(`${t % BigInt(Math.pow(Number(baseTwo), Number(wordsize)))}`);
    t = BigInt(t / BigInt(Math.pow(Number(BigInt(2)), Number(wordsize))));
  }
  if (!(t == BigInt(0))) {
    throw `Number ${number} does not fit in ${(
      wordsize * numberElement
    ).toString()} bits`;
  }
  return words;
}
