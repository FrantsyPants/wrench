import React, { Component } from "react";
import Select from "react-select";
import { Container, Row, Col } from "reactstrap";

const options = [
  { value: "chocolate", label: "Chocolate" },
  { value: "strawberry", label: "Strawberry" },
  { value: "vanilla", label: "Vanilla" }
];

class TagSelector extends Component {
  state = {};
  render() {
    return (
      <React.Fragment>
        <Container fluid={true}>
          <Row>
            <Col>
              <Select
                className="with-margin"
                closeMenuOnSelect={false}
                defaultValue={[options[1]]}
                isMulti
                options={options}
              />
            </Col>
          </Row>
        </Container>
      </React.Fragment>
    );
  }
}

export default TagSelector;
