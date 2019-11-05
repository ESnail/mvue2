// Watcher
class Watcher {
  constructor (vm, key, cb, options) {
    this.vm = vm;
    this.key = key;
    this.cb = cb;
    this.deps = [];
    
    if (options) {
      this.lazy = !!options.lazy;
      this.dirty = options.lazy;
    }

    Dep.target = this; // 将watcher
    this.vm[key]; // 触发Object.defineProperty()中定义的get，添加依赖
    Dep.target = null;
  }

  update () {
    // console.log('属性更新了');
    if (typeof this.key === 'function') {
      this.value = this.key.call(this.vm);
      this.cb && this.cb.call(this.vm, this.vm, this.value);
      return
    }
    const _computedWathers = this.vm._computedWathers;
    for (let prop in _computedWathers) {
      const watcher = _computedWathers[prop];
      if (watcher.deps.includes(this.key)) {
        watcher.value = watcher.key.call(this.vm);
        watcher.cb.call(this.vm, this.vm, watcher.value);
        break;
      }
    }

    if (this.cb) {
      this.cb.call(this.vm, this.vm, this.key);
    }
  }

  evaluate () {
    Dep.lazy = true;
    this.value = this.key.call(this.vm);
    this.dirty = false;
    Dep.lazy = false;
  }

  depend () {
    console.log(this.deps, 'deps');
    // let i = this.deps.length;
    // while (i--) {
    //   this.deps[i].depend()
    // }
  }
}

var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);
var methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];
methodsToPatch.forEach(function (method) {
  var original = arrayProto[method];
  Object.defineProperty(arrayMethods, method, {
    value: function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];
  
      var result = original.apply(this, args);
      var ob = this.__ob__;
      var inserted;
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break
        case 'splice':
          inserted = args.slice(2);
          break
      }
      // 如果改变数组的内容，内容继续去观察
      // if (inserted) { ob.observeArray(inserted); }
      // notify change
      ob.dep.notify();
      return result
    },
    enumerable: true,
    writable: true,
    configurable: true
  });
});