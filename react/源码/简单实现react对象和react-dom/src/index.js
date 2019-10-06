import React from './react';
import ReactDOM from './react-dom';
// let h = React.createElement('h1', {
//   style: {color: 'red', fontSize: '50px'}, 
//   className: 'active test', id: 'test'
// }, 'hello', React.createElement('span', {
//   style: {fontSize: '16px'}
// }, 'world'));
// console.log(h);
// let name = 'zf';
// function greeting(username) {
//   if(username) {
//     return <h1>欢迎{username}</h1>
//   }else{
//     return <h1>欢迎游客</h1>
//   }
// }
// 函数组件
// function Welcome(props) {
//   return <h1 style={props.style}>{props.name}</h1>
// }

// 类组件
class Welcome extends React.Component{
  render() {
    return React.createElement('h1', {style: this.props.style}, this.props.name, this.props.age)
  }
}

ReactDOM.render(React.createElement(Welcome, {name: 'zf', age: 10, style: {color: 'red'}}), document.getElementById('root'));
// ReactDOM.render(<Welcome name={'zf'} style={{color: 'red'}}/>, document.getElementById('root'));
