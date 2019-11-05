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