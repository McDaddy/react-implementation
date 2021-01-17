import { REACT_TEXT } from "./constants";

/**
 * 比如 ReactDOM.render(<div>123</div>, document.getElementById("root"));
 * 此时我不需要做任何事情，进来的<div>123</div>, 直接就是一个标准的React虚拟DOM
 * 为什么会这样？ 原因是@babel/preset-react在编译时自动把jsx转化成了React.createElement的形式
 * 在运行时的时候，会找到我的react.js导出的React对象，调用里面的createElement方法，然后得到这个vdom
 * @param {*} vdom
 * @param {*} container
 */
export function render(vdom, container) {
  mount(vdom, container);
}

export function mount(vdom, container) {
  const newDOM = createDOM(vdom);
  container.appendChild(newDOM);
}

/**
 * 把虚拟DOM转化成真实DOM
 * @param {*} vdom  虚拟DOM 必然是一个DOM树，有唯一的根节点
 */
export function createDOM(vdom) {
  const { type, props, ref } = vdom;
  let dom;
  if (type === REACT_TEXT) {
    dom = document.createTextNode(props.content);
  } else if (typeof type === "function") {
    // 自定义函数组件
    if (type.isReactComponent) {
      return mountClassComponent(vdom);
    } else {
      return mountFunctionComponent(vdom);
    }
  } else {
    // 原生的标签比如div
    dom = document.createElement(type); // 一个原生的DOM元素，什么属性都没
  }
  // 经过上已经创建出了一个真实的DOM节点，接下来就是更新这个节点的属性以及加载它的子元素

  if (props) {
    // 使用props里面的属性来更新刚创建出来的真实DOM属性
    updateProps(dom, {}, props);
    // 这里处理children属性
    // 当只有一个儿子时，直接挂载到当前的父DOM上
    if (typeof props.children === "object" && props.children.type) {
      mount(props.children, dom);
    } else if (Array.isArray(props.children)) {
      // 当多个儿子的时候，遍历儿子进行挂载
      reconcileChildren(props.children, dom);
    }
  }
  // 将真实dom挂载在vdom中，供后续更新使用，e.g. 在findDOM中通过vdom.dom拿到真实的dom
  vdom.dom = dom;
  return dom;
}

function reconcileChildren(childrenVdom, parentDOM) {
  childrenVdom.forEach((childVdom) => render(childVdom, parentDOM));
}

function mountFunctionComponent(vdom) {
  const { type, props } = vdom;
  // renderVdom和vdom的区别是，renderVdom是一个经过执行的最终vdom，只有原生的组件节点，而vdom可能是有自定义的组件的
  const renderVdom = type(props); // 相当于执行了函数组件的函数体
  vdom.oldRenderVdom = renderVdom; // 用于后续dom-diff使用
  return createDOM(renderVdom);
}

function mountClassComponent(vdom) {
  const { type, props } = vdom;
  const classInstance = new type(props); // 不同于函数组件，class组件需要new之后得到class实例
  vdom.classInstance = classInstance; // 用于后续dom-diff使用
  const renderVdom = classInstance.render();
  // classInstance在updateComponent使用，vdom在findDOM中使用
  classInstance.oldRenderVdom = vdom.oldRenderVdom = renderVdom;
  return createDOM(renderVdom);
}

/**
 * 使用props里面的属性来更新刚创建出来的真实DOM属性
 * @param {*} dom
 * @param {*} oldProps
 * @param {*} newProps
 */
function updateProps(dom, oldProps, newProps) {
  for (const key in newProps) {
    if (key === "children") {
      continue; // 儿子属性单独处理
    }
    if (key === "style") {
      const styleObj = newProps.style;
      for (const attr in styleObj) {
        dom.style[attr] = styleObj[attr];
      }
    } else if (key.startsWith("on")) {
      // 特殊处理所有事件
      dom[key.toLocaleLowerCase()] = newProps[key];
    } else {
      // 普通属性 如className
      dom[key] = newProps[key];
    }
  }
}

/**
 * 得到vdom的renderVdom
 * @param {*} vdom 分两种情况，1. 原生标签， 2. 自定义组件
 */
export function findDOM(vdom) {
  let { type } = vdom;
  let dom;
  if (typeof type === "function") {
    // 如果是自定义组件，取它的renderVdom
    dom = findDOM(vdom.oldRenderVdom);
  } else {
    // 原生标签，就直接拿dom
    dom = vdom.dom;
  }
  return dom;
}

const ReactDOM = { render };
export default ReactDOM;
