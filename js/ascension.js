import { flames, stages } from "./data/flames.js";

const byId = new Map(flames.map(flame => [flame.id, flame]));

export class Ascension {
  #step = 0;
  #collected = new Set();
  #pending = null;

  get step() { return this.#step; }
  get stage() { return stages[this.#step]; }
  get count() { return this.#collected.size; }
  get complete() { return this.#step === stages.length; }
  get fusing() { return this.#pending !== null; }
  get canFuse() { return !this.complete && !this.fusing && this.count === this.stage.target; }

  has(id) { return this.#collected.has(id); }

  collect(id) {
    const flame = byId.get(id);
    if (this.fusing || this.complete || flame?.step !== this.#step || this.has(id)) return false;
    this.#collected.add(id);
    return true;
  }

  beginFusion() {
    if (!this.canFuse) return null;
    this.#pending = { ...this.stage };
    return this.#pending;
  }

  finishFusion(stage) {
    if (!this.fusing || stage !== this.#pending) return false;
    this.#pending = null;
    this.#step += 1;
    return true;
  }

  reset() {
    this.#step = 0;
    this.#pending = null;
    this.#collected.clear();
  }
}
