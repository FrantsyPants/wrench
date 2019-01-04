import React, { Component } from "react";
import { Button } from "reactstrap";
import { Alert } from "reactstrap";

class App extends Component {
  render() {
    return (
      <div>
        <Alert color="primary">This is a primary alert — check it out!</Alert>
        <Button color="primary">primary</Button>{" "}
        <Button color="secondary">secondary</Button>{" "}
        <Button color="success">success</Button>{" "}
        <Button color="info">info</Button>{" "}
        <Button color="warning">warning</Button>{" "}
        <Button color="danger">danger</Button>{" "}
        <Button color="link">link</Button>
      </div>
    );
  }
}

export default App;
