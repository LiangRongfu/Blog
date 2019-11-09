# Vue双向数据绑定-Array篇
## 前言
在上一篇[Vue双向数据绑定-Object篇](https://juejin.im/post/5dc03ef8f265da4cf406fc6d)说过，Vue中Array和Object的双向数据绑定是不一样的。当使用数组的方法去改变数据，是触发不了`setter`的，那就是没法通`setter`去通知依赖了，那么Vue是怎样对数组的改变进行监控的呢？

因为`Array`的实现依然需要用到`defineReactive`、`Dep`、 `Watcher`、`Observer`，这些方法或类的已经在上一篇大致实现了，不了解的建议先看完[Vue双向数据绑定-Object篇](https://juejin.im/post/5dc03ef8f265da4cf406fc6d)。

## 基础知识
开始之前还是先来点基础知识吧
### 改变数组的方法
要监控数据的变化，是不是要先知道那些方法会改变原数组呢？具体如下
- push：向数组后面添加
- pop：从数组最后删除
- unshift：从数组前面添加
- shift：从数组前面删除
- splice：删除、替换或添加
- sort：排序
- reverse：位置颠倒

想要监听数组的变化，当被监测的数组调用上面所说的方法，再去通知数组的依赖是不是就实现了对数组的监控了呢？当然这里说的只是当前Vue 2.x实现的数组监测，当`this.arr[0] = 3`这样去改变数组的时候依然是没办法监测得到的，这个的完善就要等Vue 3了。
### 原型链
原型链这个知识点要讲明白，篇幅要挺长的，请自行查阅资料[继承与原型链](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)。这里简单放个例子体现
```javascript
var arr = [1, 2, 3]
arr.push = function(item) {
  arr[arr.length] = 'push';
}
arr.push(4);
console.log(arr); // 输出 [1, 2, 3, 'push', push: f]
```
这时`arr.push`调的是自己定义的方法而不是`Array.prototype`上的`push`方法。

## 拦截器
  拦截器其实就是Vue对数组的
  `['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']`方法进行了重写，在执行`Array.prototype`的原生方法前，先去做一些Vue需要它做的功能之后在执行。
  ```javascript
  const arrayProto = Array.prototype; // 原生的 Array.prototype
  const arrayMethods = Object.create(arrayProto); // 拷贝
  ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].forEach(function(method) {
    const original = arrayProto[method];
    // 改写arrayMethods中的 'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse' 方法
    Object.defineProperty(arrayMethods, method, { 
      value: function(...args) {
        // TODO 在这里实现Vue需要做的功能
        return original.apply(this, ...args);
      },
      enumerable: false,
      writable: true,
      configurable: true
    })
  })
  ```

  arrayMethods是我们改写过的Array.prototype，那么在把数据变成响应式的时候，把数组的原型方法改成我们自己实现的arrayMethods。当触发这些方法时，就可以去通知依赖数据发生改变了，进行依赖触发吧。

## 数组变成响应式数据
前面`Object`篇是通过`Observer`变成响应式数据的，那么就在`Observer`加上数组的代码
```javascript
const hasProto = '_proto_' in {}; // 判断浏览器能否访问原型
class Observer {
  constructor(value) {
    this.value = value;
    if (Array.isArray(value)) { // 数组处理
      if (hasProto) { // 浏览器兼容原型 把 _proto_ 改写成自己的 arrayMethods
        value._proto_ = arrayMethods;
      } else { // 不支持就把方法赋值到数组的属性上
        const arrayKeys = Object.getOwnPropertyNames(arrayMethods);
        for (let i = 0, l = arrayKeys.length; i < l; i++) {
          const key = arrayKeys[i];
          value[key] = arrayMethods[key];
        }
      }
    } else { // 对象处理
      this.walk(value);
    }
  }
  walk(obj) {
    Object.keys(obj).forEach(key => {
      defineReact(obj, key, obj[key]);
    })
  }
}
```
## 收集依赖
数组的依赖收集相对于对象的会复杂些。这里先举例子强调一下
```javascript
{
  arr: [1, 2]
}
```
`data`里有个数组`arr`，当使用时通过`this.arr`是不是同样也会触发到`getter`，那么就可以在这里进行依赖收集，但是之前的依赖是收集在`defineReactive`中的`dep`实例中，拦截器访问不到函数内部的`dep`就触发不了依赖。

Vue.js是把`Array`的依赖收集在`Observer`中
```javascript
// 工具方法
function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}
// Observer
class Observer {
  constructor(value) {
    this.value = value;
    this.dep = new Dep();
    // 把Observer实例邦到 value 的 _ob_ 属性下，那么每个响应式数据都有 _ob_ 这个属性
    // 拦截器就可以通过 _ob_ 找到依赖了
    def(value, '_ob_', this)
    .......
  }
  .......
}
```
上面只实现了把依赖收集在哪这一步。前面也说到了`Array`也是在`getter`中收集的
```javascript
// 工具方法
function observe(value, asRootData) { // 获取Observer实例
  if (!isObject(value)) {
    return;
  }
  let ob;
  if (hasOwn(value, '_ob_') && value._ob_ instanceof Observer) { // 已经被监测直接返回
    ob = value._ob_
  } else { // 还没监测
    ob = new Observer(value);
  }
  return ob;
}
// defineReactive
function defineReactive(data, key, val) {
  let childOb = observe(value);
  let dep = new Dep();
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get: function() {
      dep.depend();
      if (childOb) { // 新增
        childOb.dep.depend(); // 依赖收集
      }
      return val;
    },
    set: function(newVal) {
      if (val === newVal) {
        return;
      }
      dep.notify();
      val = newVal;
    }
  })
}
```
这里就是增加了代码把依赖收集到`Observer`实例中的`dep`，实际上加了这一步，每个被监测的数据上都有`_ob_`属性。这里留下个问题去思考下“为什么要不直接都用`childOb.dep`，还多用了一个`dep`?”

## 触发依赖
上一节实现了依赖的收集，现在要在拦截器实现依赖触发了
```javascript
  ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].forEach(function(method) {
    const original = arrayProto[method];
    // 利用上面的工具方法 def 改写一下
    def(arrayMethods, method, function mutator(...args) {
      const result = original.apply(this, args);
      const od = this._ob_; // 获取 Observer实例
      ob.dep.notify(); // 触发依赖
      return result;
    });
  })
```
那么到现在这一步数组的监测已经算是完成了，但这仅仅是对数组本身的实现，数组里的子元素是对象和新增的元素同样也要把它变成响应式数据，接下来就完善这些操作。

## 监测子元素
应该都很快想到用递归去实现，继续改写`Observer`
```javascript
class Observer {
  constructor(value) {
    this.value = value;
    this.dep = new Dep();
    def(value, '_ob_', this);

    if (Array.isArray(value)) {
      if (hasProto) {
        value._proto_ = arrayMethods;
      } else {
        const arrayKeys = Object.getOwnPropertyNames(arrayMethods);
        for (let i = 0, l = arrayKeys.length; i < l; i++) {
          const key = arrayKeys[i];
          value[key] = arrayMethods[key];
        }
      }
      this.observeArray(value); // 递归监测数组的每一项
    } else {
      this.walk(value);
    }
  }
  walk(obj) {
    Object.keys(obj).forEach(key => {
      defineReact(obj, key, obj[key]);
    })
  }
  observeArray(items) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i]); // observe 工具方法
    }
  }
}
```
在`Observer`类上增加了`observeArray`方法，这样就可以在拦截器上通过`_ob_`来调用。

## 监测新增元素
在上面说的数组方法中有`push`、`unshift`和`splice`是可以添加元素的，就要在拦截器上对这些新增元素来让它变成响应式数据。
```javascript
['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].forEach(function(method) {
  const original = arrayProto[method];
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, ...args);
    const ob = this._ob_;
    let inserted;
    switch (method) {
      case: 'push':
      case: 'unshift':
        inserted = args;
        break;
      case: 'splice': 
        inserted = args.splice(2);
        break;
    }
    if (inserted) {
      ob.observeArray(inserted); // 监测新增元素
    }
    ob.dep.notify();
    return result;
  })
})
```
到这里数组本身、数组子元素和新增数组元素的监测已经全部实现，原理的掌握并不难，就是依赖这部分内容相对对象的处理来说复杂一点，也有点绕，看多几遍就能搞懂了。

## 总结
`Array`的监测通过`getter`和拦截器来实现，在`getter`中收集依赖，在拦截器中触发依赖。依赖收集在`Observer`使拦截器能够调用。
（把源码整理一份出来）