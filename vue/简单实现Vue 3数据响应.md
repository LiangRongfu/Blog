## 简单实现Vue 3数据响应

### 前言
就在昨天Vue 3的源码公布了，在此之前相信对Vue有了解的开发者都知道Vue 3会改用`Proxy`来代替`Object.defineProperty`实现数据响应。至于为什么要用`Proxy`，大家从去年年底到现在这段时间多多少少都有了解过了吧。这两天都在看Vue 3相关的东西，此文旨在巩固用`Proxy`实现响应数据的过程，以便更好理解源码的实现。

### Proxy实现数据响应
```javascript
const toProxy = new WeakMap();
const toRaw = new WeakMap();
// toProxy、toRaw都是用于存放代理过的对象的哈希表，防止重复代理

function upDate() { // 相当于vue数据更新后执行的操作
  console.log('数据更新');
}

function isObject(target) {
  return typeof target === 'object' && target !== null;
}

function reactive(target) {
  if (!isObject(target)) { // 如果不是对象就直接返回
    return target;
  }
  if (toProxy.get(target)) { // 如果代理表中已经存在，就把这个结果返回
    return toProxy.get(target);
  }
  if (toRaw.has(target)) { // 如果这个对象已经被代理了，就把对象返回
    return target;
  }
  const handlers = {
    get(target, key, receiver) {
      let res = Reflect.get(target, key, receiver);
      if(isObject(target[key])){
        return reactive(res); // 递归
      }
      return res;
    },
    set(target, key, value, receiver) {
      if (target.hasOwnProperty(key)) {
        upDate();
      }
      return Reflect.set(target, key, value, receiver);
    },
    deleteProperty(target, key) {
      return Reflect.defineProperty(target, key);
    }
  }
  let observed = new Proxy(target, handlers);
  toProxy.set(target, observed); // target是原对象，存放原对象代理后的结果
  toRaw.set(observed, target); // target是已经代理过的对象
  return observed;
}

let obj = {
  name: 'Vue 3'
}
let vueData = reactive(obj);
vueData.name = '1'

```
上述代码就实现了数据响应，看完这些，再去看源码中的`reactive.ts`应该就很清晰了，原理是一致的，这里就大概是缺了数据变化的依赖收集和执行，还有部分拓展。

这是本人的个人理解，如有理解不正确的，请指出改正。