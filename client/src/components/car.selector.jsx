import React, { Component } from "react";
import Select from "react-select";
import { Container, Row, Col } from "reactstrap";
import "./car.selector.css";

const options = [
  { value: "chocolate", label: "Chocolate" },
  { value: "strawberry", label: "Strawberry" },
  { value: "vanilla", label: "Vanilla" }
];

class CarSelector extends Component {
  state = {};
  render() {
    return (
      <React.Fragment>
        <Row>
          <Col>
            <Select className="with-margin" options={options} />
          </Col>
          <Col>
            <Select className="with-margin" options={options} />
          </Col>
          <Col>
            <Select className="with-margin" options={options} />
          </Col>
        </Row>
      </React.Fragment>
    );
  }
}

export default CarSelector;
