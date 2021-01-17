import React from "./react";
import ReactDOM from "./react-dom";

function App() {
  return (
    <div>
      <button>+</button>
    </div>
  );
}

const element = (
  <div>
    c0
    <div>c1</div>
    <div>c2</div>
    <div>c3</div>
  </div>
);

function FunctionComponent() {
  return <div>function</div>;
}

class ClassComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  handleClick = () => {
    this.setState({ count: this.state.count + 1 });
  };

  render() {
    return (
      <div>
        <p>number: {this.state.count}</p>
        <button onClick={this.handleClick}>+</button>
      </div>
    );
  }
}

ReactDOM.render(<ClassComponent />, document.getElementById("root"));
// ReactDOM.render(<FunctionComponent />, document.getElementById("root"));
