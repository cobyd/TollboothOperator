import React, { Component } from "react";
import { HashRouter as HashRouter, Route } from "react-router-dom";
import Navbar from "./navbar";
import Vehicle from "./vehicle";
import Regulator from "./regulator";
import TollBoothOperator from "./tollBoothOperator";
import TollBooth from "./tollBooth";

import "../css/pure-min.css";
import "../App.css";
import Switch from "react-router-dom/Switch";

export default class App extends Component {
  render() {
      return (
        <HashRouter>
          <div className="App">
            <Navbar />
            <Switch>
              <Route exact path="/" component={Regulator} />
              <Route exact path="/tollbooth_operator" component={TollBoothOperator} />
            </Switch>
          </div>
        </HashRouter>
      );
  }
}