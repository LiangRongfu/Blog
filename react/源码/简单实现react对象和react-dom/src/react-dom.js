function render(element, parentNode) { // 创建真正的DOM
  if(typeof element == 'string' || typeof element == 'number'){
    return parentNode.appendChild(document.createTextNode(element));
  }
  let type, props;
  type = element.type;
  props = element.props;
  // 
  if(type.isClassComponent) { // type是一个类
    element = new type(props).render();
    type = element.type;
    props = element.props;
  } else if (typeof type === 'function') {
    element = type(props);
    type = element.type;
    props = element.props;
  }
  let domElement = document.createElement(type);
  for(let propName in props){
    if (propName === 'children') {
      let children = props[propName];
      children = Array.isArray(children)? children : [children];
      children.forEach(child => {
        render(child, domElement);
      });
    } else if (propName === 'className') { // 生成class
      domElement.className = props[propName];
    }else if (propName === 'style'){ // 生成样式
      let styleObj = props[propName];
      let cssText = Object.keys(styleObj).map(attr => {
        return `${attr.replace(/([A-Z])/g, function() {
          return "-" + arguments[1].toLocaleLowerCase()
        })} : ${styleObj[attr]}`
      }).join(';');
      domElement.style.cssText = cssText;
    } else { // 生成其他属性
      if(propName.substring(0, 2) !== '__'){
        domElement.setAttribute(propName, props[propName]);
      }
    }
  }
  return parentNode.appendChild(domElement);
}
export default {
  render
}