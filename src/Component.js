import { createDOM, findDOM, compareTwoVdom } from "./react-dom";
import { isFunction } from "./utils";

export const updateQueue = {
  isBatchUpdate: false,
  updaters: new Set(), // 等待更新的队列
  batchUpdate() {
    // 批量更新
    for (const updater of updateQueue.updaters) {
      updater.updateComponent();
    }
    updateQueue.isBatchUpdate = false;
    updateQueue.updaters.clear();
  },
};

class Updater {
  // 每个组件都有一个Updater， 用来做更新的异步处理
  constructor(classInstance) {
    this.classInstance = classInstance;
    this.pendingStates = []; // 用来记录有哪些传入的需要更新的state，还未被更新
    this.callbacks = [];
    this.nextProps = classInstance.props;
  }
  addState(partialState, callback) {
    this.pendingStates.push(partialState);
    if (typeof callback === "function") {
      this.callbacks.push(callback); //状态更新后的回调
    }
    this.emitUpdate();
  }
  emitUpdate(nextProps) {
    this.nextProps = nextProps || this.nextProps;
    if (updateQueue.isBatchUpdate) {
      //如果当前的批量模式。先缓存updater
      updateQueue.updaters.add(this); //本次setState调用结束
    } else {
      this.updateComponent(); //直接更新组件
    }
  }
  updateComponent() {
    let { classInstance, pendingStates, nextProps } = this;
    // 如果有等待更新的状态对象的话
    if (nextProps || pendingStates.length > 0) {
      shouldUpdate(classInstance, nextProps, this.getState(nextProps));
    }
  }
  getState(nextProps) {
    const { classInstance, pendingStates } = this;
    let { state } = classInstance;
    if (pendingStates.length) {
      pendingStates.forEach((nextState) => {
        if (isFunction(nextState)) {
          // 如果传入参数，那么每次传入的state都是经过计算好的状态
          nextState = nextState.call(classInstance, state);
        }
        state = { ...state, ...nextState }; // 集合所有未更新的state，如果属性重复以最后一次为准
      });
      pendingStates.length = 0; //清空队列
    }
    state = getDerivedStateFromProps(classInstance, nextProps, state);
    return state;
  }
}

export function getDerivedStateFromProps(classInstance, nextProps, state) {
  if (classInstance.constructor.getDerivedStateFromProps) {
    const partialState = classInstance.constructor.getDerivedStateFromProps(
      nextProps,
      state
    );
    if (partialState) {
      state = { ...state, ...partialState };
    }
  }
  return state;
}

function shouldUpdate(classInstance, nextProps, nextState) {
  let willUpdate = true;
  if (classInstance.shouldComponentUpdate) {
    willUpdate = classInstance.shouldComponentUpdate(nextProps, nextState);
  }
  if (willUpdate && classInstance.componentWillUpdate) {
    classInstance.componentWillUpdate();
  }
  if (nextProps) {
    classInstance.props = nextProps;
  }
  classInstance.state = nextState;
  if (willUpdate) {
    classInstance.updateComponent();
  }
}

export class Component {
  static isReactComponent = true; // 标示自己是一个React class组件，区别与函数组件
  constructor(props) {
    this.props = props;
    this.state = {};
    this.updater = new Updater(this);
  }
  setState(partialState, callback) {
    this.updater.addState(partialState, callback); // 在updater中添加一个partialState
  }
  forceUpdate() {
    this.state = getDerivedStateFromProps(this, this.props, this.state);
    this.updateComponent();
  }
  updateComponent() {
    // render方法是在实现类中定义的
    let newRenderVdom = this.render(); // 重新调用render方法，得到新的虚拟DOM
    const oldDOM = findDOM(this.oldRenderVdom);
    let extraArgs =
      this.getSnapshotBeforeUpdate && this.getSnapshotBeforeUpdate();
    // 这里只会无条件重新创建DOM
    // const newDOM = createDOM(newRenderVdom);
    // oldDOM.parentNode.replaceChild(newDOM, oldDOM);
    // 替换成DOM DIFF
    compareTwoVdom(oldDOM.parentNode, this.oldRenderVdom, newRenderVdom);
    this.oldRenderVdom = newRenderVdom;
    if (this.componentDidUpdate) {
      this.componentDidUpdate(this.props, this.state, extraArgs);
    }
  }
}

export class PureComponent extends Component {
  // 重写此方法，只有属性变化了才更新
  shouldComponentUpdate(nextProps, nextState) {
    return (
      !shallowEqual(this.props, nextProps) ||
      !shallowEqual(this.state, nextState)
    );
  }
}

/**
 * 浅比较, 如果前后是都是新建的对象{ count: 1 }即使内存地址变化，依然是可以浅比较相等的
 * 但如果是{ count: { num: 1 } }, 那么就没用了，因为内层的{ num: 1 }的内存地址前后不同，还是会返回false
 * @param {*} obj1 
 * @param {*} obj2 
 */
function shallowEqual(obj1, obj2) {
  if (obj1 === obj2) { // 内存地址相同或是原始类型相同，就相等
    return true;
  }
  // 如果有一方不是Object类型或者为null，即原始类型，且不相等，就返回false
  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  ) {
    return false;
  }
  // 走到这里，两边都是对象类型
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  // 属性个数不等，返回false
  if (keys1.length !== keys2.length) {
    return false;
  }
  // 走到此处，两个属性长度相同
  for (const key of keys1) {
    // 如果obj2没有obj1中有的属性， 或者， 同个属性值不等（Object类型内存地址不同）就返回false
    if (!obj2.hasOwnProperty(key) || obj1[key] !== obj2[key]) {
      return false;
    }
  }
  return true;
}
