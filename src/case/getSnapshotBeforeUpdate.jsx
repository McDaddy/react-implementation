// import React from "react";
// import ReactDOM from "react-dom";
import React from "../react";
import ReactDOM from "../react-dom";

export class Counter extends React.Component {
  ulRef = React.createRef();
  state = { list: [] };
  getSnapshotBeforeUpdate() {
    return this.ulRef.current.scrollHeight;
  }
  componentDidUpdate(prevProps, prevState, scrollHeight) {
    console.log(
      "ul高度本次添加了",
      this.ulRef.current.scrollHeight - scrollHeight + "px"
    );
  }
  componentDidMount() {
    setInterval(() => {
      let list = this.state.list;
      this.setState({ list: [...list, list.length] });
    }, 1000);
  }
  render() {
    return (
      <div>
        <ul ref={this.ulRef}>
          {this.state.list.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }
}
