import { updateQueue } from "./Component";

/**
 * 事件合成
 * @param {*} dom 真实dom
 * @param {*} eventType  e.g. click
 * @param {*} eventHandler e.g. clickHandler
 */
export function addEvent(dom, eventType, eventHandler) {
  let store;
  if (dom.store) {
    store = dom.store;
  } else {
    dom.store = {};
    store = dom.store;
  }
  // 每个真实dom上都有一个store属性，用来存放所有的事件回调
  store[eventType] = eventHandler;
  if (!document[eventType]) {
    document[eventType] = dispatchEvent; // 在document上注册，所有类型的回调都是dispatchEvent。 e.g. document的onClick就是dispatchEvent
  }
}

let syntheticEvent = {};

/**
 *
 * @param {*} event 原生event
 */
function dispatchEvent(event) {
  let { target, type } = event; // target就是实际触发事件的元素，而document永远是currentTarget
  let eventType = `on${type}`; // e.g. onclick
  updateQueue.isBatchUpdate = true; // 由React管理的生命周期内更新状态都要开启batch模式，例如在onClick中写setTimeout，里面去setState，由于是异步，这个dispatchEvent函数已经走完，batch重新被标为false，所以不能异步更新
  createSyntheticEvent(event); // 创建合成事件
  // 相当于模拟了一次冒泡的行为，target元素本身是没有被绑定的事件的
  while (target) {
    let { store } = target;
    let handler = store && store[eventType];
    handler && handler.call(target, syntheticEvent);
    target = target.parentNode;
  }
  for (const key in syntheticEvent) {
    syntheticEvent[key] = null;
  }
  // 冒泡完成开始批量更新
  updateQueue.batchUpdate();
}

/**
 * 这里理论上用来做一些抹平浏览器差异的工作
 * @param {} nativeEvent
 */
function createSyntheticEvent(nativeEvent) {
  for (const key in nativeEvent) {
    syntheticEvent[key] = nativeEvent[key];
  }
}
