import { Component, PureComponent } from "./Component";
import { wrapToVdom } from "./utils";
import { useState, useReducer } from './react-dom';

/**
 * 创建一个虚拟DOM
 * @param {*} type 元素的类型可以是原生类型的字符串，也可以是函数
 * @param {*} config 配置的属性
 * @param {*} children 子孙
 */
function createElement(type, config, children) {
  let key;
  let ref;
  if (config) {
    delete config.__source;
    delete config.__self;
    key = config.key;
    delete config.key;
    ref = config.ref;
    delete config.ref;
  }
  let props = { ...config };
  if (arguments.length > 3) {
    // 多个儿子时
    props.children = Array.prototype.slice.call(arguments, 2).map(wrapToVdom);
  } else {
    // 单个儿子时
    props.children = wrapToVdom(children);
  }
  // 一个虚拟DOM返回type, key, props...
  return {
    type,
    key,
    props,
    ref,
  };
}
function createRef() {
  return { current: null };
}

function createContext(initialValue = {}) {
  let context = { Provider, Consumer };
  function Provider(props) {
    context._currentValue = context._currentValue || initialValue;
    Object.assign(context._currentValue, props.value);
    return props.children;
  }
  function Consumer(props) {
    return props.children(context._currentValue);
  }
  return context;
}

/**
 * memo的本质就是返回了一个PureComponent
 * @param {*} OldComponent 
 */
function memo(OldComponent) {
  return class extends PureComponent {
    render() {
      return <OldComponent {...this.props} />
    }
  }
}

const React = {
  createElement,
  Component,
  createRef,
  createContext,
  PureComponent,
  memo,
  useReducer,
  useState
};

export default React;
