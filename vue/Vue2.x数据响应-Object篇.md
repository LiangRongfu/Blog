# Vue2.x数据响应-Object篇

## 前言
  相信每位前端人都被问过`Vue`双向数据绑定的原理是什么吧？应该也很快能答出来是通过Object.defineProperty实现的，但这仅仅只回答了一半，因为`Object`和`Array`的实现方式是不一样的，这也是为什么标题是`Object`篇的原因。

## 基础知识
  首先了解一下下面的概念：
### 声明式编程和命令式编程
  这个概念就通俗点说了，想详细了解的可自行查阅资料
  - 命令式：命令计算机如何去做事，严格按照我们的命令去实现，不管我们想要的结果是什么。
  - 声明式：我们只需要告诉计算机想要什么，让它自己去想办法按它的思路去做。
  这里用一个简单的例子去对比两者的区别,
  ```javascript
    // 给定一个数组 arr = [1, 2, 3], 想要一个新的数组每一项都加一
    const arr = [1, 2, 3];
    // 命令式 告诉浏览器循环数组，每一个元素+1，然后push进新数组
    let newArr1 = [];
    for (let i = 0; i < arr.length; i++) {
      newArr1.push(arr[i]+1);
    }
    console.log(newArr1) // 拿到新数组

    // 声明式 告诉浏览器新数组的每一项是旧数组对应的每一项加一
    let result = arr.map(item => {
      return item + 1;
    })
    console.log(result) // 新的数组
  ```
  为什么要说这个呢？因为Vue.js是声明式的，按API文档的要求来写Vue就知道要做什么。

### Object.defineProperty
  在一个对象上定义一个新属性，或者修改一个对象的现有属性， 并返回这个对象, Vue.js是利用这个方法修改`data`对象的属性。
  ```javascript
    let name = 'test';
    let obj = {};
    Object.defineProperty(obj, 'name', {
      configurable: true, // 可修改，可删除
      enumerable: true, //可枚举
      get: function() { // 读值触发
        console.log('读取数据');
        return name;
      },
      set: function(newVal) { // 赋值触发
        if(name === newVal){
          return;
        }
        console.log('重新赋值');
        name = newVal;
      }
    })
    console.log(obj.name);
    obj.name = '赋值';
    //打印出
    // 读取数据
    // test
    // 重新赋值
    // 赋值
  ```
  到这里已经算是Vue的`Object`双向数据绑定原理了。


  实现完整的`Object`对象的双向数据绑定，Vue做了那些操作呢？
 
## 数据监控：“用”和“变”
  通过上面的概念介绍就知道`Object.defineProperty`是做数据监控的，获取值的时候`get`被触发进行相应操作，设置数据时，`set`被触发这时就能知道数据是否被改变。那我们是不是就很清楚知道可以在数据被调用触发`get`函数的时候，去收集那些地方使用了对应的数据了呢？然后在设置的时候，触发`set`函数去通知`get`收集好的依赖进行相应的操作呢？好了，下面就针对目前这个理解，对`Object.defineProperty`进行封装
## defineReactive
  ```javascript
  function defineReactive(data, key, val) {
    //let dep = [];
    let dep = new Dep() // 修改
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get: function() {
        // 收集依赖
        // dep.push(window.target) // window.target后面会定义，很6的操作，期待一下
        dep.depend() // 修改
        return val
      },
      set: function(newVal){
        if(val === newVal){
          return
        }
        // 触发依赖
        // for(let i=0; i<dep.length; i++){
        //   dep[i](newVal, val);
        // }
        dep.notify() // 修改
        val = newVal
      }
    })
  }
  ```
  这里就实现了在`get`的时候，收集依赖保存到`dep`这个数组中，当触发`set`的时候，就把`dep`中的每个依赖触发。在源码里是把`dep`封装成一个类，来管理依赖的，下面就实现一下`Dep`这个类吧。
## Dep类
  ```javascript
  export default class Dep {
    constructor() {
      this.subs = []
    }
    addSub(sub) {
      this.subs.push(sub)
    }
    removeSub(sub) {
      remove(this.subs, sub)
    }
    depend() {
      if(window.target){
        this.addSub(window.target) // window.target是什么？
      }
    }
    notify () {
      const subs = this.subs.slice()
      for (let i = 0, l = subs.length; i < l; i++) {
        subs[i].update() // window.target的update方法
      }
    }
  }

  function remove (arr, item) {
    if(arr.length){
      const index = arr.indexOf(item)
      if(index > -1){
        return arr.splice(index, 1)
      }
    }
  }
  ```
  这样我们封装的`Dep`类就可以收集依赖、删除依赖、通知依赖，那我们就要把这个`Dep`类用上，对上面的`defineReactive`进行修改一下。Dep收集到的依赖看代码都知道是`window.target`，当数据发生变化的时候，调用`window.target`的`update`方法进行响应更新。
## Watcher类
  源码里有个`Watcher`类，它的实例就是我们收集的`window.target`,下面先来看看Vue中的一个用法
  ```javascript
  vm.$watch('user.name', function(newVal, oldVal){
    console.log('我的新名叫' + newVal); // 就是update函数
  })

  ```
  当Vue实例中的`data.user.name`被修改时，会触发`function`的执行，也就是说需要把这个函数添加到`data.user.name`的依赖中，怎么收集呢？是不是调一下`data.user.name`的`get`方法就可以了。那么`Watcher`要做的就是把自己的实例添加到对应属性的`Dep`中，同时也有通知去更新的能力，下面写下`Watcher`
  ```javascript
  export default class Watcher {
    constructor (vm, expOrFn, cb) {
      this.vm = vm
      this.getter = parsePath(expOrFn);
      this.cb = cb;
      this.value = this.get() // 获取初始值
    }
    get() {
      window.target = this // 把当前实例暴露给Dep，Dep就知道依赖是谁了
      let value = this.getter.call(this.vm, this.vm) // 取一下值，触发vm实例上对应属性的get方法收集依赖
      window.target = undefined // 用完给别人用
      return value
    }
    update() {
      const oldValue = this.value // 旧值
      this.value = this.get() // 获取新值
      this.cb.call(this.vm, this.value, oldValue)
    }
  }
  ```
  到这里再回顾一下上面写好的几个程序，你会发现之间都是很巧妙的结合了，特别是`Watcher`的实例，把自己给添加到`Dep`中了，反正我自己是觉得这操作特6。这里也说明了Vue中de`$watch`是通过`Watcher`实现的。
  
  当然`parsePath`还没说是什么，结合上面的例子和`Watcher`应该知道`parsePath`返回的是一个方法，并且被调用后返回一个值，也就是获取值的功能，下面来实现一下
  ```javascript
  const bailRE = /[^\w.$]/
  export function parsePath (path) {
    if (bailRE.test(path)) {
      return
    }
    const segments = path.spilt('.')
    return function(obj){
      for(let i = 0; i < segments.length; i++){
        if(!obj) return
        obj = obj[segments[i]]
      }
      return obj
    }
  }
  ```
  Watcher中的`this.getter.call(this.vm, this.vm)`把`parsePath`的返回的函数指向`this.vm`，并把`this.vm`当参数传过去取值。
## Observer类
  Vue中`data`的每一个属性都会被监测到，实际上我们使用`defineReactive`就可以监测，如果一个`data`有很多属性，那是不是要调用很多次呢，那么就有了`Observer`这个工具类把每个属性变成`getter/setter`，来码上
  ```javascript
  export class Observer {
    constructor(value) {
      this.value = value
      if(!Array.isArray(value)){
        this.walk(value)
      }
    }
    walk(obj) {
      Object.keys(obj).forEach(key => {
        defineReactive(obj, key, obj[key])
      })
    }
  }
  ```
  那么`new Observer(obj)`就能把`obj`下的属性都变成`getter/setter`了，如果`obj[key]`依然是一个对象呢？是不是要继续`new Observer(obj[key])`呀，那么就是`defineReactive`拿到`obj[key]`时，需要进行判断是不是对象，是的话就进行递归，那么加上这一步操作`defineReactive`就完整了
  ```javascript
  function defineReactive(data, key, val) {
    if(typeof val === 'object') {
      new Observer(val)
    }
    let dep = new Dep()
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get: function() {
        dep.depend()
        return val
      },
      set: function(newVal){
        if(val === newVal){
          return
        }
        dep.notify()
        val = newVal
      }
    })
  }
  ```
  到这里Vue中`Object`是数据响应已经完成了，但是有缺陷大家都很清楚，就是给`data`新增属性或者删除属性时，无法监测，上面的实现过程都是依赖现有属性进行的，但是Vue提供`$set`和`$delete`去实现这两个功能，相信弄懂上面的代码，这两个的实现就不难了。

## 总结
  对Vue中`Object`的数据响应，我总结的一句话就是“定义`getter/setter`备用，“用”：收集依赖，“变”：触发依赖
  - “备用”: 通过`Observer`和`defineReactive`把属性变成`getter/setter`；
  - “用”: 通过`Watcher`在`getter`中把依赖收集到`dep`；
  - “变”: 通过`setter`告诉`dep`数据变化了，`dep`通知`Watcher`去更新；
