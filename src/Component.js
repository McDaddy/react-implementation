import { createDOM, findDOM, compareTwoVdom } from "./react-dom";
import { isFunction } from "./utils";

export const updateQueue = {
  isBatchUpdate: false,
  updaters: new Set(), // 等待更新的队列
  add(updater) {
    updateQueue.updaters.add(updater); // 这个updater就是Updater的实例
  },
  batchUpdate() {
    // 批量更新
    for (const updater of updateQueue.updaters) {
      //   updater.updateComponent();
      updater.emitUpdate();
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
  }
  addState(partialState) {
    this.pendingStates.push(partialState);
    // this.emitUpdate();
    updateQueue.isBatchUpdate ? updateQueue.add(this) : this.emitUpdate(); // 判断下如果是batch模式就加入update队列，否则立即触发更新
  }
  emitUpdate(nextProps) {
    const { classInstance, pendingStates } = this;
    // if (pendingStates.length > 0) {
    //   const nextState = this.getState(); // 取得批量合成后的state
    //   classInstance.state = nextState;
    //   classInstance.updateComponent();
    // }
    if (nextProps || pendingStates.length > 0) {
      shouldUpdate(classInstance, nextProps, this.getState());
    }
  }
  getState() {
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
    return state;
  }
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
    // this.state = { ...this.state, ...partialState };
    // this.updateComponent();
  }
  forceUpdate() {
    let nextState = this.state;
    let nextProps = this.props;
    this.updateComponent();
  }
  updateComponent() {
    // render方法是在实现类中定义的
    let newRenderVdom = this.render(); // 重新调用render方法，得到新的虚拟DOM
    const oldDOM = findDOM(this.oldRenderVdom);
    // 这里只会无条件重新创建DOM
    // const newDOM = createDOM(newRenderVdom);
    // oldDOM.parentNode.replaceChild(newDOM, oldDOM);
    // 替换成DOM DIFF
    compareTwoVdom(oldDOM.parentNode, this.oldRenderVdom, newRenderVdom);
    this.oldRenderVdom = newRenderVdom;
    if (this.componentDidUpdate) {
      this.componentDidUpdate(this.props, this.state);
    }
  }
}
