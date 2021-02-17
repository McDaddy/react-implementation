// import React from "react";
// import ReactDOM from "react-dom";
import React from "../react";
import ReactDOM from "../react-dom";

export function FunctionComponent() {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <p>{count}</p>
      <button
        onClick={() => {
          setCount(count + 1);
        }}
      >
        +
      </button>
    </div>
  );
}
