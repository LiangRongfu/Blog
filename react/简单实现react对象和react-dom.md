## 前言
大家都很清楚知道React是一个用于构建用户界面的JavaScript库，可以书写jsx编译成真正的DOM插入到要显示的页面上。下面我们做一些准备工作了解jsx变成DOM的过程，进而自己去实现一遍。

## 准备工作
```
npm install create-react-app -g
create-react-app react-demo
cd react-demo
npm start
```
这时候我们已经新建好一个react项目了，接下来在index.js中写入`console.log(<h1 style={{color: 'red'}}>hello world</h1>)`，打印出来的结果
```
{
  props: {
    children: 'hello world',
    style: {color: ''red'}
    ...
  },
  type: 'h1'
}
```
这就是一个React对象，也就是虚拟DOM。接下来我们打开[babel官网](https://babeljs.io/repl#?babili=false&browsers=&build=&builtIns=false&spec=false&loose=false&code_lz=DwCwjAfCCmA2sHsAEB3BAnAJsA9OCQA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=es2016%2Ces2017%2Creact&prettier=false&targets=&version=7.6.2&externalPlugins=)，输入`<h1 style={{color: 'red'}}>hello world</h1>`，结果如下图所示
![](https://user-gold-cdn.xitu.io/2019/10/6/16d9edcdf06d18cf?w=3138&h=1154&f=png&s=201917)
通过babel把jsx转化成React中的createElement函数，执行后返回React对象。

我们在项目中实现一个简单的例子
```javascript
// index.js
import React from 'react';
import ReactDom from 'react-dom';

ReactDom.render(<h1 style={{color: 'red'}}>hello world</h1>, document.getElementById('root'));
```
结果如下图
![](https://user-gold-cdn.xitu.io/2019/10/6/16d9ee603b7bfb55?w=1944&h=320&f=png&s=86889)

到这一步大家应该清楚知道写jsx到我们看到的页面效果的实现过程了吧？通过babel转化jsx成React中的createElement函数并执行，得到React对象传入到 ReactDom.render 生成真是的DOM，并且插入到指定的DOM节点上。

## React中createElement函数
下面来实现一下createElement函数，返回一个React对象，创建react.js
```javascript
// react.js
function ReactElement(type, props) { // 生成react对象 虚拟DOM
  const element = {type, props}
  return element;
}
function createElement(type, config, children){
  let propName;
  const props = {};
  for (propName in  config) {
    props[propName] = config[propName]; // 拷贝config
  }
  const childrenLength = arguments.length - 2; // 获取children个数
  if (childrenLength === 1) {
    props.children = children;
  } else {
    props.children = Array.prototype.slice.call(arguments, 2) // 传入了多个children
  }
  return ReactElement(type, props) // react对象，虚拟DOM
}

export default { createElement }

```
修改一下index.js，验证一下写的createElement是否正确
```javascript
import React from './react.js'; // 引入自己写的
...

console.log( React.createElement('h1', {style: {color: 'red'}}, 'hello world') );
// 或
// console.log(<h1 style={{color: 'red'}}>hello world</h1>)

// 打印结果如下, 则正确了
//{
//  type: 'h1',
//  props: {
//    style: {color: 'red'},
//    children: 'hello world',
//    ...
//  }
}

```

## react-dom中render函数
下面来实现render函数，创建react-dom.js
```javascript
function render(element, parentNode) {
  if (typeof element == 'string' || typeof element == 'number') { // 单独处理
    return parentNode.appendChild(document.createTextNode(element));
  }
  let type, props;
  type = element.type;
  props = element.props;

  let domElement = document.createElement(type);
  for (let propName in props) {
    if (propName === 'children') {
      let children = props[propName];
      children = Array.isArray(children)? children : [children];
      children.forEach(child => {
        render(child, domElement); // 递归
      })
    } else if (propName === 'className') { // 生成类名
      domElement.className = props[propName];
    } else if (propName === 'style') { // 生成样式
      let styleObj = props[propName];
      let cssText = Object.keys(styleObj).map(attr => {
        return `${attr.replace(/([A-Z])/g, function() {
          return "-" + arguments[1].toLocaleLowerCase()
        })} : ${styleObj[attr]}`
      }).join(';');
      domElement.style.cssText = cssText;
    }else { // 生成其他属性，还有像‘htmlFor’等等这些需要单独处理的，这里就不一一处理了
      if(propName.substring(0, 2) !== '__'){
        domElement.setAttribute(propName, props[propName]);
      }
    }
  }
  return parentNode.appendChild(domElement); // 插入生成的真是DOM
}

export default { render }

```
接下来修改index.js进行验证
```javascript
import React from './react.js';
import ReactDOM from './react-dom.js';

let element = React.createElement('h1', {style: {color: 'red'}}, 'hello world');

ReactDOM.render(element, document.getElementById('root'));
```
结果如下，代码运行成功
![](https://user-gold-cdn.xitu.io/2019/10/6/16d9f370e96a123b?w=1920&h=316&f=png&s=78132)

这里的代码，当我们使用函数组件或类组件时，不能正确生成DOM，继续拓展下
### 函数组件
```javascript
// index.js
import React from './react.js';
import ReactDOM from './react-dom.js';
// 函数组件
function Welcome(props) {
  return <h1 style={props.style}>{props.name}</h1>
}
let element = React.createElement(Welcome, {name: 'hello world', style: {color: 'red'}});
ReactDOM.render(element, document.getElementById('root'));
```
这时候createElement返回的React对象的type是function，应该在创建DOM之前执行这个函数，拿到Welcome的返回值，再进行解析，那么就在`react-dom.js`中加多个判断
```javascript
  ...
  let type, props;
  type = element.type;
  props = element.props;

  if (typeof type === 'function') { // 如果是函数组件，先执行
    element = type(props);
    type = element.type;
    props = element.props;
  }

  let domElement = document.createElement(type);
  ...
```
这时候就能正常使用函数组件了

### 类组件
```javascript
// index.js
import React from './react.js';
import ReactDOM from './react-dom.js';
// 类组件
class Welcome extends React.Component{
  render() {
    return React.createElement('h1', {style: this.props.style}, this.props.name, this.props.age)
  }
}
let element = React.createElement(Welcome, {name: 'hello world', style: {color: 'red'}});
ReactDOM.render(element, document.getElementById('root'));
```
类组件需要React中的父类Component，那么就在react.js加上
```javascript
// react.js
class Component {
  static isClassComponent = true // 用于区分类组件
  constructor(props) {
    this.props = props
  }
}
...
export default {
  createElement,
  Component
}

```
由于使用`typeof`判断类返回的也是'function'，那么就跟函数组件的判断有冲突了，而且类是需要new进行实例化的，因此在父类上加多了一个静态属性 isClassComponent 继承给子类进行区分。下面就继续修改`react-dom.js`的代码
```javascript
// react-dom.js
  ...
  if(type.isClassComponent) { // 类组件
    element = new type(props).render();
    type = element.type;
    props = element.props;
  } else if (typeof type === 'function') { // 函数组件
    element = type(props);
    type = element.type;
    props = element.props;
  }
  ...
```
这样也把类组件拓展成功了。

以上过程就简单实现了react中的createElement和react-dom中的render。如有错误，请指出，感谢阅读。