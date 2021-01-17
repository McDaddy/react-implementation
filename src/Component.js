import { createDOM, findDOM } from "./react-dom";
import { isFunction } from "./utils";

export const updateQueue = {
  isBatchUpdate: false,
  updaters: new Set(),
  add(updater) {
    updateQueue.updaters.add(updater);
  },
  batchUpdate() {
    // 批量更新
    updateQueue.isBatchUpdate = false;
    for (const updater of updateQueue.updaters) {
    //   updater.updateComponent();
        updater.emitUpdate();
    }
    updateQueue.isBatchUpdate = false;
    updateQueue.updaters.clear();
  },
};

class Updater {
  constructor(classInstance) {
    this.classInstance = classInstance;
    this.pendingStates = [];
  }
  addState(partialState) {
    this.pendingStates.push(partialState);
    // this.emitUpdate();
    updateQueue.isBatchUpdate ? updateQueue.add(this) : this.emitUpdate()
  }
  emitUpdate() {
    const { classInstance, pendingStates } = this;
    // if (updateQueue.isBatchUpdate) {
    //   updateQueue.updaters.add(this);
    // } else {
    //   this.updateComponent();
    // }
    if (pendingStates.length > 0) {
      const nextState = this.getState();
      classInstance.state = nextState;
      classInstance.updateComponent();
    }
  }
  updateComponent() {
    const { classInstance, pendingStates, nextProps } = this;
    classInstance.updateComponent();
    //   if (nextProps || pendingStates.length > 0) {

    //   }
  }
  getState() {
    const { classInstance, pendingStates } = this;
    let { state } = classInstance;
    if (pendingStates.length) {
      pendingStates.forEach((nextState) => {
        if (isFunction(nextState)) {
          nextState = nextState.call(classInstance, state);
        }
        state = { ...state, ...nextState };
      });
      pendingStates.length = 0; //清空队列
    }
    return state;
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
    this.updater.addState(partialState, callback);
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
    const newDOM = createDOM(newRenderVdom);
    oldDOM.parentNode.replaceChild(newDOM, oldDOM);
    this.oldRenderVdom = newRenderVdom;
  }
}
