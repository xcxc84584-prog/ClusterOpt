/**
 * Fenwick tree for line counts of ordered slices.
 * prefix(index) returns the number of lines preceding that slice.
 */
export class LineTree {
  #counts = [];
  #tree = [];

  constructor(counts = []) {
    this.rebuild(counts);
  }

  rebuild(counts) {
    this.#counts = counts.slice();
    this.#tree = new Array(counts.length + 1).fill(0);
    counts.forEach((value, index) => this.#add(index, value));
  }

  #add(index, delta) {
    for (let i = index + 1; i < this.#tree.length; i += i & -i) {
      this.#tree[i] += delta;
    }
  }

  update(index, count) {
    if (!Number.isInteger(index) || index < 0 || index >= this.#counts.length) {
      throw new RangeError('Invalid slice index');
    }
    const delta = count - this.#counts[index];
    this.#counts[index] = count;
    this.#add(index, delta);
  }

  prefix(index) {
    let result = 0;
    for (let i = index; i > 0; i -= i & -i) result += this.#tree[i];
    return result;
  }

  get total() {
    return this.prefix(this.#counts.length);
  }

  /** Locate the slice containing a zero-based line number. */
  locate(line) {
    if (!Number.isInteger(line) || line < 0 || line >= this.total) {
      return null;
    }
    let index = 0;
    let bit = 1;
    while (bit * 2 < this.#tree.length) bit *= 2;
    let remainder = line;
    for (; bit > 0; bit >>= 1) {
      const next = index + bit;
      if (next < this.#tree.length && this.#tree[next] <= remainder) {
        remainder -= this.#tree[next];
        index = next;
      }
    }
    return {sliceIndex: index, localLine: remainder};
  }
}
