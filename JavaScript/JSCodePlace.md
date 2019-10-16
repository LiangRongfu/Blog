## 防抖
```javascript
function debounce(fn, time) {
  let timer = null;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(() =>  {
      fn.apply(this, arguments);
    }, time)
  }
}
```
