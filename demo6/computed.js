class Computed {
  constructor (vm) {
    this.vm = vm;
    this.computed = vm.$options.computed;
    this.initComputed(vm, this.computed)
  }

  initComputed (vm, computed) {
    Object.keys(computed).forEach(key => {
      if (key in vm) {
        throw new Error(`computed ${key} 已经在 data 中定义过了`);
      }

      const val = computed[key];
      if (typeof val === 'function') { // get
        let wathers = vm._computedWathers = Object.create(null);
        wathers[key] = new Watcher(vm, val, ()=>{}, { lazy: true });

        this.defineComputed(vm, key, val);
      }
    })
  }

  defineComputed (vm, key, val) {
    Object.defineProperty(vm, key, {
      get () {
        return () => {
          let watcher = this._computedWathers && this._computedWathers[key];
          if (watcher) {
            if (watcher.dirty) {
              watcher.evaluate();
            }
            if (Dep.target) {
              watcher.depend();
            }
          }

          return watcher.value;
        }
      }
    })
  }
}