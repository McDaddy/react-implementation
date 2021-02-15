import { REACT_TEXT } from "./constants";
import { addEvent } from "./event";
import { getDerivedStateFromProps } from "./Component";

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
  if (!vdom) {
    return;
  }
  const newDOM = createDOM(vdom);
  container.appendChild(newDOM);
  if (newDOM.componentDidMount) {
    newDOM.componentDidMount();
  }
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
      dom = mountClassComponent(vdom);
    } else {
      dom = mountFunctionComponent(vdom);
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
  if (ref) {
    ref.current = dom;
  }
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
  if (type.contextType) {
    classInstance.context = type.contextType._currentValue;
  }
  if (classInstance.componentWillMount) {
    classInstance.componentWillMount();
  }
  classInstance.state = getDerivedStateFromProps(
    classInstance,
    classInstance.props,
    classInstance.state
  );
  const renderVdom = classInstance.render();
  // classInstance在updateComponent使用，vdom在findDOM中使用
  classInstance.oldRenderVdom = vdom.oldRenderVdom = renderVdom;
  const dom = createDOM(renderVdom);
  if (classInstance.componentDidMount) {
    dom.componentDidMount = classInstance.componentDidMount.bind(classInstance);
  }
  return dom;
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
      //   dom[key.toLocaleLowerCase()] = newProps[key];
      addEvent(dom, key.toLocaleLowerCase(), newProps[key]);
    } else {
      // 普通属性 如className
      dom[key] = newProps[key];
    }
  }
}

/**
 * 得到vdom的真实dom
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

// dom diff
export function compareTwoVdom(parentDOM, oldVdom, newVdom, nextDOM) {
  if (!oldVdom && !newVdom) {
    // 老的没有，新的也没有，那就不需要改变什么
    return;
  } else if (oldVdom && !newVdom) {
    // 老的有，新的没有，就是需要卸载了
    const currentDOM = findDOM(oldVdom); // 找到当前vdom的真实dom
    if (currentDOM) {
      parentDOM.removeChild(currentDOM);
    }
    if (oldVdom.classInstance && oldVdom.classInstance.componentWillUnmount) {
      oldVdom.classInstance.componentWillUnmount();
    }
    return;
  } else if (!oldVdom && newVdom) {
    // 以前没有，现在有，就要直接新建DOM
    const newDOM = createDOM(newVdom);
    if (nextDOM) {
      parentDOM.insertBefore(newDOM, nextDOM); // 如果原来的dom是有下面的弟弟元素。那么要插入到弟弟前面
    } else {
      parentDOM.appendChild(newDOM); // 唯一的子元素或者原来的oldDOM就是最后一个元素
    }
    if (newDOM.componentDidMount) {
      newDOM.componentDidMount();
    }
    return;
  } else if (oldVdom && newVdom && oldVdom.type !== newVdom.type) {
    // 前后都有，但是类型不同，也要重建
    const oldDOM = findDOM(oldVdom);
    const newDOM = createDOM(newVdom);
    oldDOM.parentNode.replaceChild(newDOM, oldDOM);
    if (oldVdom.classInstance && oldVdom.classInstance.componentWillUnmount) {
      oldVdom.classInstance.componentWillUnmount();
    }
    if (newDOM.componentDidMount) {
      newDOM.componentDidMount();
    }
    return;
  } else {
    // 新老节点都有值，且类型相同
    deepCompare(oldVdom, newVdom);
    return;
  }
}

/**
 * 深度比较两个虚拟DOM， 到了这个方法里面， 前提是oldVdom和newVdom的都存在且type一致
 * @param {*} oldVdom
 * @param {*} newVdom
 */
function deepCompare(oldVdom, newVdom) {
  if (oldVdom.type === REACT_TEXT) {
    // 当时文本节点，就复用老的DOM节点
    const currentDOM = (newVdom.dom = oldVdom.dom);
    currentDOM.textContent = newVdom.props.content; // 直接修改老DOM节点的内容
  } else if (typeof oldVdom.type === "string") {
    // 如果是原生类型
    const currentDOM = (newVdom.dom = oldVdom.dom);
    updateProps(currentDOM, oldVdom.props, newVdom.props); // 复用老的DOM， 更新DOM上的属性
    updateChildren(currentDOM, oldVdom.props.children, newVdom.props.children); // 更新儿子
  } else if (typeof oldVdom.type === "function") {
    // 自定义组件， 分门别类更新
    if (oldVdom.type.isReactComponent) {
      updateClassComponent(oldVdom, newVdom);
    } else {
      updateFunctionComponent(oldVdom, newVdom);
    }
  }
}

/**
 * 更新函数组件
 * @param {*} oldVdom
 * @param {*} newVdom
 */
function updateFunctionComponent(oldVdom, newVdom) {
  const parentDOM = findDOM(oldVdom).parentNode; // 得到老的真实DOM
  const { type, props } = newVdom;
  const { oldRenderVdom } = oldVdom; // 得到老的renderVdom 即 被转化成原生tag的Vdom
  const newRenderVdom = type(props); // 执行函数，得到新的vdom
  compareTwoVdom(parentDOM, oldRenderVdom, newRenderVdom); // 因为类型是相同的，所以要比较两个函数组件前后属性和children的区别，能复用的就复用
  newVdom.oldRenderVdom = newRenderVdom;
}

/**
 * 更新class组件
 * @param {}} oldVdom
 * @param {*} newVdom
 */
function updateClassComponent(oldVdom, newVdom) {
  const classInstance = (newVdom.classInstance = oldVdom.classInstance); // 复用类的实例，类的实例不管怎么更新，永远是一个实例
  newVdom.oldRenderVdom = oldVdom.oldRenderVdom;
  if (classInstance.componentWillReceiveProps) {
    // 生命周期
    classInstance.componentWillReceiveProps();
  }
  // 触发组件的更新，传入新的props
  classInstance.updater.emitUpdate(newVdom.props);
}

/**
 * 深度比较儿子
 * @param {*} parentDOM
 * @param {*} oldVChildren
 * @param {*} newVChildren
 */
function updateChildren(parentDOM, oldVChildren, newVChildren) {
  // 统一为数组
  oldVChildren = Array.isArray(oldVChildren) ? oldVChildren : [oldVChildren];
  newVChildren = Array.isArray(newVChildren) ? newVChildren : [newVChildren];
  // 如果old的长度大，那么老的后面的部分不需要比较， newVdom[i]就是空
  // 如果new的长度大， 那么老的[i]就是空， 新的会直接创建
  let maxLength = Math.max(oldVChildren.length, newVChildren.length);
  for (let i = 0; i < maxLength; i++) {
    const nextDOM = oldVChildren.find(
      // 找到老的儿子中，index大于当前节点的， 用于找到合适插入位置
      (item, index) => index > i && item && item.dom
    );
    compareTwoVdom(
      parentDOM,
      oldVChildren[i],
      newVChildren[i],
      nextDOM && nextDOM.dom
    );
  }
}

const ReactDOM = { render };
export default ReactDOM;
