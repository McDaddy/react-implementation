import { REACT_TEXT } from "./constants";

/**
 * 为了做到所有元素的统一，不管原来是什么，最终都包装成React元素的形式
 * 为了后续DOM-DIFF统一操作
 * @param {} element 
 */
export function wrapToVdom(element) {
  return typeof element === "string" || typeof element === "number"
    ? { type: REACT_TEXT, props: { content: element } }
    : element;
}
