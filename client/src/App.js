import React, { Component } from "react";
import { Button, Navbar, Container, Row, Col } from "reactstrap";
import CarSelector from "./components/car.selector";
import TagSelector from "./components/tag.selector";
import QuestionCreationArea from "./components/question.creation.area";
import QuestionDisplayArea from "./components/question.display.area";

class App extends Component {
  render() {
    return (
      <div>
        <Navbar color="secondary">
          <Button color="primary">primary</Button> NavBar!
        </Navbar>
        <Container fluid={true}>
          <Row fluid={true}>
            <Col>
              <Row>
                <Col>
                  <CarSelector />
                </Col>
              </Row>
              <Row>
                <Col>
                  <TagSelector />
                </Col>
              </Row>
              <Row>
                <Col>
                  <QuestionCreationArea />
                </Col>
              </Row>
            </Col>
            <Col>
              <QuestionDisplayArea />
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default App;
