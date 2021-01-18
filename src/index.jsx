// import React from "react";
// import ReactDOM from "react-dom";
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
    console.log('constructor');
    super(props);
    this.state = { count: 0 };
  }

  componentDidMount() {
    console.log('componentDidMount');
  }

  componentDidUpdate() {
    console.log('componentDidUpdate');
  }

  componentWillMount() {
    console.log('componentWillMount');
  }

  componentWillUpdate() {
    console.log('componentWillUpdate');
  }

  componentWillUnmount() {
    console.log('componentWillUnmount');
  }

  shouldComponentUpdate() {
    console.log('shouldComponentUpdate');
    return true;
  }

  handleClick = () => {
    // this.setState((s) => ({ count: s.count + 1 }));
    this.setState({ count: this.state.count + 1 });
    this.setState((s) => ({ count: s.count + 1 }));
    this.setState((s) => ({ count: s.count + 1 }));
    this.setState((s) => ({ count: s.count + 1 }));
    // console.log(this.state);
    // this.setState({ count: this.state.count + 1 });
    // console.log(this.state);
    // setTimeout(() => {
    //     this.setState({ count: this.state.count + 1 });
    //     console.log(this.state);
    //     this.setState({ count: this.state.count + 1 });
    //     console.log(this.state);
    // });
  };

  render() {
    console.log('render');
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
