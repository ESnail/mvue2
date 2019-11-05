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

    // computed
    if (options.computed) {
      new Computed(this)
    }

    new Compile(options.el, this);

    if (options.created) {
      options.created.call(this);
    }
  }

  observe (value) {
    if (!value || typeof value !== 'object') {
      return;
    }
    if (Array.isArray(value)) {
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
    
    const _this = this;
    Object.defineProperty(obj, key, {
      get () {
        // 收集依赖
        // Dep.target && dep.addDep(Dep.target);

        if (Dep.target) {
          dep.addDep(Dep.target);
        } else {
          if (key && Dep.lazy) {
            const _computedWathers = _this._computedWathers;
            for (let prop in _computedWathers) {
              const watcher = _computedWathers[prop];
              if (watcher.dirty) {
                watcher.deps.push(key);
                break;
              }
            }
          }
        }

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



