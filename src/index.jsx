// import React from "react";
// import ReactDOM from "react-dom";
import React from "./react";
import ReactDOM from "./react-dom";
// import { Counter } from "./case/getSnapshotBeforeUpdate.jsx";
// import { Person } from "./case/context.jsx";
import { Counter } from './case/pureComponent.jsx';
import { FunctionComponent } from './case/useState.jsx';

// ReactDOM.render(<Counter />, document.getElementById("root"));
// ReactDOM.render(<ClassComponent />, document.getElementById("root"));
ReactDOM.render(<FunctionComponent />, document.getElementById("root"));
