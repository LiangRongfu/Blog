## webpack基础

>网上关于webpack的文章已经很多了，本文只是从个人理解的角度进行总结和整理。

### 什么是webpack？

![](https://user-gold-cdn.xitu.io/2019/10/5/16d99e241ec295d1?w=2202&h=938&f=png&s=149862)
webpack可以说是一个打包工具，有下面的一些特点
- 可以进行代码转换可以把TypeScript、less转化成浏览器可执行的JavaScript、css等等；
- 可以压缩js、css、html等等，进行文件优化；
- 热更新，代码修改后会自动刷新浏览器页面；
还有代码分割、代码校验等等这些，它就是一个把我们的开发流程变简单，提高开发效率的工具。


### webpack核心概念
- Entry：入口，webpack执行构建的入口，可配置多入口；
- Output：出口，webpack输出文件存放的地方，默认是`./dist`；
- Module：模块，webpack会从配置的Entry开始递归找出所有依赖的模块；
- Loader：模块转化器，把模块内容按需求转成新内容；
- Chunk：代码块，用于代码合并与分割；
- Plugin：插件，在webpack构建过程中的特定时机注入扩展逻辑来改变构建结果；
- context：打包路径上下文，必须是绝对路径；

下面分别看看每个概念的一些用法，要注意的是webpack4我们不做任何设置都会默认配置，可以直接打包。

#### Entry（入口）
我们在使用vue-cli 2.x初始化出来的项目，配置文件里设置了单一入口

webpack.base.conf.js
```
module.exports = {
  ...
  entry: './src/main.js',
  ...
}
```
怎么实现多入口呢？如下
```
module.exports = {
  ...
  entry: ['./src/main.js', './src/vendors.js']
  ...
}

// 或者

module.exports = {
  ...
  entry: {
    main: './src/main.js',
    vendors: './src/vendors.js'
  }
  ...
}
```
多入口的使用场景：分离应用程序和第三方库入口和多页面应用。

#### Output（出口）
基础配置
```
// 单一入口配置
module.exports = {
  ...
  output: {
    filename: 'bundle.[hash:5].js',
    path: path.resolve(__dirname,'dist')
  }
  ...
}

// 多入口配置
module.exports = {
  ...
  output: {
    filename: '[name].[hash:5].js',
    path: path.resolve(__dirname,'dist')
  }
  ...
}
// [name]的值就是多入口中entry的键值
```

#### Module（模块）
webpack 模块能够以各种方式表达它们的依赖关系，webpack的模块规范可以是
- CommonJS
- esModule
- AMD
- @import
- 样式中的图片链接

#### Loader（模块转化器）
webpack 通过 loader 可以支持各种语言和预处理器编写模块。loader的执行顺序是从下往上，从右到左。
```
module: {
  ...
  rules: [
      {
        test: /\.css/,
        use:['style-loader','css-loader']
      }
  ]
  ...
}
```
如上代码，执行转化css先会用`css-loader`（负责解析@import引入的css）转化后，再使用`style-loader`插入到head标签中。
在实际项目中，我们可能会用到less、scss或者stylus等等来编写css，那我们就要安装对应的loader进行预处理了；
- .scss    node-sass sass-loader
- .less    less      less-loader
- .stylus  stylus    stylus-loader
为什么都要安装两个包？可以这样理解，`sass-loader`调用了`node-sass`把`scss`转化成`css`，如果我们是用`scss`，就需要在`css-loader`后面加上`sass-loader`。

#### Plugin（插件）
插件在于解决loader无法实现的事情，是webpack的支柱功能。插件的使用方法就是new一个实例。webpack的插件很多，我们可以根据实际的需要进行安装使用。在我们打包过程中，js，css，html的压缩就是通过配置插件来完成的。这里需要提醒注意的一点是，我们使用vue-cli初始化出来的项目，默认会压缩js，不压缩css，如果我们自己手动加入了压缩css的插件，需要把压缩js的插件也手动加入。

Chunk和context了解就行这里不展开去讲了。