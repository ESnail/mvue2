// 用法：new Compile(el, vm)
class Compile {
  constructor (el, vm) {
    this.$el = document.querySelector(el);
    this.$vm = vm;

    // 编译
    if (this.$el) {
      // 转换内部内容为片段Fragment
      this.$fragment = this.node2Fragment(this.$el);
      // 执行编译
      this.compile(this.$fragment);
      // 将编译完的html结果追加至$el
      this.$el.appendChild(this.$fragment);
    }
  }

  // 将宿主元素中代码片段拿出来遍历，这样做比较高效
  node2Fragment (el) {
    let frag = document.createDocumentFragment();
    // 将el中的所有子元素搬家至frag中
    let child;
    while(child = el.firstChild) {
      // appendChild 特性，若原文档中有该元素，会删除。
      // 会一个一个把el中的子节点都删除，然后添加到frag中
      frag.appendChild(child);
    }
    return frag;
  }
  // 编译过程
  compile(el) {
    const childNodes = el.childNodes;
    Array.from(childNodes).forEach(node => {
      // 元素
      if (this.isElement(node)) {
        //console.log('编译元素' + node.nodeName);
        
        // 遍历属性，检测m-，@，：，m-model
        const attrs = node.attributes;
        Array.from(attrs).forEach(attr => {
          // sdebugger
          const attrName = attr.name; // 属性名 m-text
          const attrVal = attr.value; // 属性值 key
          if (this.isDirective(attrName)) {
            // m-text, m-html
            const type = attrName.substring(2);
            this[type] && this[type](node, this.$vm, attrVal);
          }
          if (this.isEvent(attrName)) {
            const type = attrName.substring(1); // @click
            this.eventHandler(node, this.$vm, attrVal, type);
          }
        })
        // 插值
      } else if (this.isInterpolation(node)) {
        // console.log('编译文本' + node.textContent);
        this.compileText(node);
      }

      if (node.childNodes && node.childNodes.length) {
        this.compile(node)
      }
    })
  }
  // 元素
  isElement (node) {
    return node.nodeType === 1;
  }
  // 插值
  isInterpolation (node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
  }

  // 指令
  isDirective (attr) {
    return attr.indexOf('m-') === 0;
  }

  // 事件
  isEvent (attr) {
    return attr.indexOf('@') === 0;
  }
  
  compileText (node) {
    // console.log('type', RegExp.$1);
    // node.textContent = this.$vm.$data[RegExp.$1];
    this.update(node, this.$vm, RegExp.$1, 'text')
  }

  // 更新函数
  update (node, vm, key, type) {
    const updateFn = this[type + 'Update'];
    // 初始化
    updateFn && updateFn(node, vm, key);

    // 依赖收集
    if (vm._computedWathers && vm._computedWathers[key]) {
      vm._computedWathers[key].cb = function (vm, val) {
        updateFn && updateFn(node, vm, key, val);
      }
    } else {
      new Watcher(vm, key, function (vm, key) {
        updateFn && updateFn(node, vm, key);
      })
    }
  }

  textUpdate (node, vm, key, val) {
    console.log(node, vm, key, val)
    if (typeof vm[key] === 'function') {
      node.textContent = vm[key].call(vm);
      return;
    }
    node.textContent = vm[key] || val;
  }

  text (node, vm, key) {
    this.update(node, vm, key, 'text');
  }

  eventHandler (node, vm, key, type) {
    const fn = vm.$options.methods && vm.$options.methods[key];
    if (type && fn) {
      node.addEventListener(type, fn.bind(vm));
    }
  }

  // 双绑
  model (node, vm, key) {
    this.update(node, vm, key, 'model');

    node.addEventListener('input', (e) => {
      vm[key] = e.target.value;
    })
  }

  modelUpdate (node, vm, key) {
    node.value = vm[key];
  }

  html (node, vm, key) {
    this.update(node, vm, key, 'html');
  }

  htmlUpdate (node, vm, key) {
    node.innerHTML = vm[key];
  }

  for (node, vm, exp) {
    const arr = exp.split(' in ');
    const key = arr[1];
    this.update(node, vm, key, 'for');
  }

  forUpdate (node, vm, key) {
    let obj = vm[key];
    if (Array.isArray(obj)) {
      let parent = node.parentElement;
      let frag = document.createDocumentFragment();

      let childNodes = parent.children;
      let i = 0;
      Array.from(childNodes).forEach(el => {
        el.removeAttribute(`m-for`);
        el.textContent = obj[i];
        frag.appendChild(el);
        i++;
      })
      
      for (; i < obj.length; i++) {
        let cloneNode = node.cloneNode();
        cloneNode.removeAttribute(`m-for`);
        cloneNode.textContent = obj[i];
        frag.appendChild(cloneNode);
      }
      parent.appendChild(frag);
    }
  }
}