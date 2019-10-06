class Component {
  static isClassComponent = true
  constructor(props) {
    this.props = props
  }
}

function ReactElement(type, props) { // 生成react对象 虚拟DOM
  const element = {type, props}
  return element;
}
function createElement(type, config, children) {
  let propName;
  const props = {};
  for (propName in config) {
    props[propName] = config[propName];
  }
  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    props.children = Array.prototype.slice.call(arguments, 2);
  }
  return ReactElement(type, props);
}
export default {
  createElement,
  Component
}