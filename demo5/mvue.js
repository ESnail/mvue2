// new MVue({data: ...})
class MVue {
  constructor (options) {
    this.$options = options;

    this.$data = options.data;
    // 数据响应
    this.observe(this.$data);

    // 模拟watcher创建
    // new Watcher();
    // this.$data.test;
    // new Watcher();
    // this.$data.foo.bar;

    new Compile(options.el, this);

    if (options.created) {
      options.created.call(this);
    }
  }

  observe (value) {
    if (!value || typeof value !== 'object') {
      return;
    }

    // 遍历
    Object.keys(value).forEach(key => {
      this.defineReactive(value, key, value[key]);
      // 代理data到实例对象上
      this.proxyData(key);
    })
  }

  observeArray (items) {
    for (var i = 0, l = items.length; i < l; i++) {
      this.observe(items[i]);
    }
  }

  // 数据响应
  defineReactive (obj, key, val) {
    this.observe(val);

    const dep = new Dep();

    Object.defineProperty(obj, key, {
      get () {
        // 收集依赖
        Dep.target && dep.addDep(Dep.target);

        if (Array.isArray(val)) {
          val.__proto__ = arrayMethods;
          // 对数组内容进一步处理
          // this.observeArray(value);
          
          val.__ob__ = {}
          val.__ob__.dep = dep;
        }
        return val;
      },
      set (newVal) {
        if (val === newVal) {
          return;
        }
        val = newVal;
        console.log(`${key}属性更新了：${val}`)
        // 通知依赖更新
        dep.notify();
      }
    })
  }

  proxyData (key) {
    Object.defineProperty(this, key, {
      get () {
        return this.$data[key];
      },
      set (newVal) {
        this.$data[key] = newVal;
      }
    })
  }
}

// 管理watcher
class Dep {
  constructor () {
    this.deps = []; // 每一个dep就是一个watcher
  }

  addDep (dep) {
    this.deps.push(dep);
  }

  notify () {
    // console.log(this.deps, 'deps')
    this.deps.forEach(dep => dep.update());
  }
}

// Watcher
class Watcher {
  constructor (vm, key, cb) {
    this.vm = vm;
    this.key = key;
    this.cb = cb;

    Dep.target = this; // 将watcher
    this.vm[key]; // 触发Object.defineProperty()中定义的get，添加依赖
    Dep.target = null;
  }

  update () {
    // console.log('属性更新了');
    if (this.cb) {
      this.cb.call(this.vm, this.vm, this.key)
    }
  }
}

function def (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
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