export class Cps {
  private cps = 0;
  private cnt = 0;
  private time = 0;

  get get() {
    return this.cps;
  }
  tick() {
    const tmp = performance.now();
    this.cnt++;
    if (tmp - this.time >= 1000) {
      this.cps = Math.round((this.cnt * 1000) / (tmp - this.time));
      this.time = tmp;
      this.cnt = 0;
    }
  }
}
