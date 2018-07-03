import React, { Component } from "react";
import TollBoothContract from "../../build/contracts/TollBoothHolder.json";
import getWeb3 from "../../utils/getWeb3";

const Promise = require("bluebird");

class TollBooth extends Component {
  constructor(props) {
    super(props);

    this.state = {
      accounts: [],
      netId: null,
      web3: null
    };
    this.getTollBoothFromAddress = this.getTollBoothFromAddress.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  async componentWillMount() {
    const web3 = await getWeb3;
    console.log(web3.web3);
    Promise.promisifyAll(web3.web3.eth, { suffix: "Promise" });
    Promise.promisifyAll(web3.web3.version, { suffix: "Promise" });
    await this.setState({ web3: web3.web3 });
    this.instantiateContract();
  }

  async instantiateContract() {
    console.log("Starting contract init");
    const accounts = await this.state.web3.eth.getAccountsPromise();
    const netId = await this.state.web3.version.getNetworkPromise();
    console.log(accounts);
    console.log(netId);
    this.setState({
      accounts: accounts,
      netId: netId
    });
  }

  async handleChange(event) {
    console.log(event);
    // if(event.target.id == 'address') {
    //   let stateObject = this.state;
    //   stateObject.tollBoothInstance[event.target.id] = event.target.value;
    //   this.setState(stateObject);
    //   console.log(this.state);
    // }
    // if(event.target.id == 'fromAddress' || event.target.id == 'toAddress' || event.target.id == 'price') {
    //   let stateObject = this.state;
    //   stateObject.routePriceInstance[event.target.id] = event.target.value;
    //   this.setState(stateObject);
    //   console.log(this.state);
    // }
    // if(event.target.id == 'vehicleType' || event.target.id == 'multiplier') {
    //   let stateObject = this.state;
    //   stateObject.multiplierInstance[event.target.id] = event.target.value;
    //   this.setState(stateObject);
    //   console.log(this.state);
    // }
    if(event.target.id == 'fromAddress') {
      let stateObject = this.state;
      stateObject[event.target.id] = event.target.value;
      this.setState(stateObject);
      console.log(this.state);
    }
  }

  async getTollBoothFromAddress() {
    const TollBooth = this.state.web3.eth.contract(TollBoothContract.abi);
      const tollBoothInstance = await TollBooth.at(this.state.fromAddress);
      console.log(tollBoothInstance);
      this.setState({
        tollBoothInstance: tollBoothInstance, 
        owner: await tollBoothInstance.getOwner.call({from: this.state.accounts[0]
      })});
      console.log(this.state);
  }
  
  render() {
    if (this.state.tollBoothOperatorInstance) {
      return (
        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
                Tollbooth
            </div>
          </div>
        </main>
      );
    } else {
      return(
        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <form onSubmit={this.getTollBoothFromAddress}>
                <input
                id="fromAddress"
                placeholder="fromAddress"
                type="text"
                value={this.state.fromAddress}
                autoComplete="off"
                onChange={this.handleChange}
              />
              <button className="button" type="submit" disabled={!this.state.fromAddress}>
                From Address
              </button>
              </form>
            </div>
          </div>
        </main>
      );
    }
  }
}
  
  export default TollBooth;
  