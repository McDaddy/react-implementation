import { updateQueue } from "./Component";

export function addEvent(dom, eventType, eventHandler) {
  let store;
  if (dom.store) {
    store = dom.store;
  } else {
    dom.store = {};
    store = dom.store;
  }
  store[eventType] = eventHandler;
  if (!document[eventType]) {
    document[eventType] = dispatchEvent;
  }
}

let syntheticEvent = {};

function dispatchEvent(event) {
  let { target, type } = event;
  let eventType = `on${type}`;
  updateQueue.isBatchUpdate = true;
  createSyntheticEvent(event);
  while (target) {
    let { store } = target;
    let handler = store && store[eventType];
    handler && handler.call(target, syntheticEvent);
    target = target.parentNode;
  }
  for (const key in syntheticEvent) {
    syntheticEvent[key] = null;
  }
  updateQueue.batchUpdate();
}

function createSyntheticEvent(nativeEvent) {
  for (const key in nativeEvent) {
    syntheticEvent[key] = nativeEvent[key];
  }
}
