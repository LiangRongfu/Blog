# 常用JS
## 防抖
```javascript
function debounce(func, wait, immediate){
  let timeout;
  let result;
  const debounced = function(){
    if(timeout)clearTimeout(timeout);
    if(immediate){ // 需要立即执行，过了多少秒后才可以重新触发
      let callNow = !timeout;
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
      if(callNow) result = func.apply(this,arguments);
    }else{ // 触发后过了多少秒后执行
      timeout = setTimeout(() => {
        func.apply(this, arguments)
      }, wait);
    }
    return result;
  }

  debounced.cancel = function(){ // 暴露取消方法
    clearTimeout(timeout);
    timeout = null;
  }

  return debounced;
}
```

## 节流
```javascript
function throttle(fn, time){
    let canRun = true;  
    return function(){
        if(!canRun){return  false;}
        canRun = false;
        setTimeout(() => {
             fn.apply(this, arguments);
             canRun = true;
        }, time)
    }
}
```

## 获取url参数
```javascript
function getParam(name){
    let params = window.location.search.substr(1).split('&');
    for(let i=0; i < params.length; i++){
        let param = params[i].split('=');
        if(name === param[0]){
            return param[1];
       }
    }
    return null;
}

// RegExp 
function getUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
}
```
## post请求下载
```javascript
var DownLoadFile = function (options) {
    var config = $.extend(true, { method: 'post' }, options);
    var $iframe = $('<iframe id="down-file-iframe" enctype="multipart/form-data" />');
    var $form = $('<form target="down-file-iframe" method="' + config.method + '" />');
    $form.attr('action', config.url);
    for (var key in config.data) {
        $form.append('<input type="hidden" name="' + key + '" value="' + config.data[key] + '" />');
    }
    $iframe.append($form);
    $(document.body).append($iframe);
    $form[0].submit();
    $iframe.remove();
};
```