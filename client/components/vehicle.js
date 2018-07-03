import React, { Component } from "react";
import getWeb3 from "../../utils/getWeb3";
import TollBootherOperatorContract from "../../build/contracts/TollBoothOperator.json";
import RegulatorContract from "../../build/contracts/Regulator.json";

const Promise = require("bluebird");
const toBytes32 = require("../../utils/toBytes32.js");

class Vehicle extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      accounts: [],
      netId: null,
      tollBoothOperatorInstance: {},
      web3: null,
      entryTollBooth: null,
      operators: []
    };
    this.handleChange = this.handleChange.bind(this);
  }
  
  async componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.
    const web3 = await getWeb3;
    console.log(web3.web3);
    Promise.promisifyAll(web3.web3.eth, { suffix: "Promise" });
    Promise.promisifyAll(web3.web3.version, { suffix: "Promise" });
    await this.setState({ web3: web3.web3 });
    this.instantiateContract();
  }

  async handleChange(event) {
    console.log(event);
    let stateObject = function() {
      let returnObj = {};
      returnObj[this.target.id] = this.target.value;
      console.log(returnObj);
      return returnObj;
    }.bind(event)();

    this.setState(stateObject);
    console.log(this.state);
  }

  async enterRoad() {
    const hashedChoice = await this.hash(this.state.choice, this.state.salt);
    await this.state.instance.methods.commit(hashedChoice).send({
      from: this.state.accounts[0],
      value: this.state.stakes
    });
    this.setState({
      committed: true
    });
    this.state.handlerFunction(true);
  }
  
  async instantiateContract() {
      console.log("Starting contract init");
      const accounts = await this.state.web3.eth.getAccountsPromise();
      const netId = await this.state.web3.version.getNetworkPromise();
      console.log(accounts);
      console.log(netId);
      // console.log(TollBootherOperatorContract.networks[netId].address);
      console.log(RegulatorContract.networks[netId].address);
      const Regulator = this.state.web3.eth.contract(RegulatorContract.abi);
      const regulatorInstance = Regulator.at(RegulatorContract.networks[netId].address);
      // regulatorInstance.setProvider(this.state.web3.currentProvider);
      Promise.promisifyAll(regulatorInstance, { suffix: "Promise" });
      let operators = await regulatorInstance.LogTollBoothOperatorCreatedPromise({}, {fromBlock: 0, toBlock: 'latest'})
      console.log(operators);
      this.setState({
        accounts: accounts,
        netId: netId,
        regulatorInstance: regulatorInstance,
        operators: operators
      });
    }
  
    render() {
      return (
        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <div className="functionality">
                <h3>Enter Road:</h3>
                <form onSubmit={this.enterRoad}>
                <input
                    id="entryTollBooth"
                    placeholder="Entry toll booth"
                    type="text"
                    value={this.state.entryTollBooth}
                    autoComplete="off"
                    onChange={this.handleChange}
                  />
                  <button className="button" type="submit" disabled={!this.state.entryTollBooth}>
                    Enter
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      );
    }
  }
  
  export default Vehicle;
  