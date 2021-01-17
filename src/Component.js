import { createDOM, findDOM } from "./react-dom";

export class Component {
  static isReactComponent = true; // 标示自己是一个React class组件，区别与函数组件
  constructor(props) {
    this.props = props;
    this.state = {};
    // this.updater = new this.updater(this);
  }
  setState(partialState, callback) {
    // this.updater.addState(partialState, callback);
    this.state = { ...this.state, ...partialState };
    this.updateComponent();
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
