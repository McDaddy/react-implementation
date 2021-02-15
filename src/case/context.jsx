// import React from "react";
// import ReactDOM from "react-dom";
import React from "../react";
import ReactDOM from "../react-dom";
let PersonContext = React.createContext();
function getStyle(color) {
  return { border: `5px solid ${color}`, padding: "5px", margin: "5px" };
}

export class Person extends React.Component {
  state = { color: "red" };
  changeColor = (color) => this.setState({ color });
  render() {
    let contextValue = {
      name: "Person",
      color: this.state.color,
      changeColor: this.changeColor,
    };
    return (
      <PersonContext.Provider value={contextValue}>
        <div style={{ ...getStyle(this.state.color), width: "200px" }}>
          人
          <Head />
          <Body />
        </div>
      </PersonContext.Provider>
    );
  }
}
class Head extends React.Component {
  static contextType = PersonContext;
  render() {
    return (
      <div style={getStyle(this.context.color)}>
        头
        <Hair />
      </div>
    );
  }
}
class Hair extends React.Component {
  static contextType = PersonContext;
  render() {
    console.log("Eye", this.context);
    return <div style={getStyle(this.context.color)}>头发</div>;
  }
}
class Body extends React.Component {
  static contextType = PersonContext;
  render() {
    return (
      <div style={getStyle(this.context.color)}>
        四肢
        <Hand />
      </div>
    );
  }
}
function Hand() {
  return (
    <PersonContext.Consumer>
      {(contextValue) => (
        <div style={getStyle(contextValue.color)}>
          手
          <button
            style={{ color: "red" }}
            onClick={() => contextValue.changeColor("red")}
          >
            变红
          </button>
          <button
            style={{ color: "green" }}
            onClick={() => contextValue.changeColor("green")}
          >
            变绿
          </button>
        </div>
      )}
    </PersonContext.Consumer>
  );
}
