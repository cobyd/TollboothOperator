import React, { Component } from "react";
import getWeb3 from "../../utils/getWeb3";
import RegulatorContract from "../../build/contracts/Regulator.json";

const Promise = require("bluebird");

class Regulator extends Component {
    constructor(props) {
      super(props);
  
      this.state = {
        accounts: [],
        netId: null,
        web3: null,
        vehicleTypeChange: {},
        tollBoothOperatorInstance: {},
        vehicles: [],
        tollBoothOperators: []
      };
      this.getvehicles = this.getvehicles.bind(this);
      this.getTollBoothOperators = this.getTollBoothOperators.bind(this);
      this.setVehicleType = this.setVehicleType.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.createRegulatorInstance = this.createRegulatorInstance.bind(this);
      this.getRegulatorFromAddress = this.getRegulatorFromAddress.bind(this);
      this.createTollBoothOperator = this.createTollBoothOperator.bind(this);
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

    async createRegulatorInstance() {
      const Regulator = this.state.web3.eth.contract(RegulatorContract.abi);
      Promise.promisifyAll(Regulator, { suffix: "Promise" });
      let gasEstimate = await this.state.web3.eth.estimateGasPromise({data: RegulatorContract.bytecode});
      console.log(gasEstimate);
      const regulatorInstance = await Regulator.new({data: RegulatorContract.bytecode, from: this.state.accounts[0], gas: gasEstimate});
      Promise.promisifyAll(regulatorInstance, { suffix: "Promise" });
      console.log(regulatorInstance);
      this.setState({regulatorInstance: regulatorInstance});
    }

    async getRegulatorFromAddress() {
      const Regulator = this.state.web3.eth.contract(RegulatorContract.abi);
      Promise.promisifyAll(Regulator, { suffix: "Promise" });
      const regulatorInstance = await Regulator.at(this.state.fromAddress);
      Promise.promisifyAll(regulatorInstance, { suffix: "Promise" });
      console.log(regulatorInstance);
      this.setState({regulatorInstance: regulatorInstance});
    }
  

    async setVehicleType() {
      console.log()
      const ret = await this.state.regulatorInstance.setVehicleType(
        this.state.vehicleTypeChange.address,
        this.state.vehicleTypeChange.type,
        { from: this.state.accounts[0] }
      );
      this.setState({ vehicleTypeChange: {} });
      console.log(ret);
    }

    async handleChange(event) {
      console.log(event);
      if(event.target.id == 'address' || event.target.id == 'type') {
        let stateObject = this.state;
        stateObject.vehicleTypeChange[event.target.id] = event.target.value;
        this.setState(stateObject);
        console.log(this.state);
      }
      if(event.target.id == 'owner' || event.target.id == 'deposit') {
        let stateObject = this.state;
        stateObject.tollBoothOperatorInstance[event.target.id] = event.target.value;
        this.setState(stateObject);
        console.log(this.state);
      }
      if(event.target.id == 'fromAddress') {
        let stateObject = this.state;
        stateObject[event.target.id] = event.target.value;
        this.setState(stateObject);
        console.log(this.state);
      }
    }

    async getvehicles() {
      this.state.regulatorInstance.LogVehicleTypeSet({}, {fromBlock: 0, toBlock: 'latest'}).get((error, logs) => {
        let vehicles = logs.map(log => {
          return log.args.vehicle + ", " + log.args.vehicleType;
        })
        this.setState({vehicles: vehicles})
      });
    }

    async getTollBoothOperators() {
      this.state.regulatorInstance.LogTollBoothOperatorCreated({}, {fromBlock: 0, toBlock: 'latest'}).get((error, logs) => {
        let tollBoothOperators = logs.map(log => {
          return log.args.newOperator;
        })
        this.setState({tollBoothOperators: tollBoothOperators})
      });
    }

    async createTollBoothOperator() {
      const tollBoothOperatorInstance = this.state.regulatorInstance.createNewOperator(
        this.state.tollBoothOperatorInstance.owner,
        this.state.tollBoothOperatorInstance.deposit,
        { from: this.state.accounts[0], gas: 4000000 }
      );
      console.log(tollBoothOperatorInstance);
      this.setState({ tollBoothOperatorInstance: {} });
    }
  
    render() {
      if (this.state.regulatorInstance) {
        return (
          <main className="container">
            <div className="pure-g">
              <div className="pure-u-1-1">
                <div className="functionality">
                  Regulator address: {this.state.regulatorInstance.address}
                </div>
                <div className="functionality">
                    Vehicles: <button onClick={this.getvehicles}>Get vehicles</button>
                    {this.state.vehicles.join(";")}
                  </div>
                <div className="functionality">
                  Set new vehicle type:
                  <form onSubmit={this.setVehicleType}>
                    <input
                      id="address"
                      placeholder="address"
                      type="text"
                      value={this.state.vehicleTypeChange.address}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <input
                      id="type"
                      placeholder="type"
                      type="number"
                      value={this.state.vehicleTypeChange.type}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <button className="button" type="submit" disabled={!this.state.vehicleTypeChange.address && !this.state.vehicleTypeChange.type}>
                      Set
                    </button>
                  </form>
                  <div className="functionality">
                    Tollbooth Operators: <button onClick={this.getTollBoothOperators}>Get tollbooth operators</button>
                    {this.state.tollBoothOperators.join(", ")}
                  </div>
                </div>
                <div className="functionality">
                  Create new TollBootherOperator:
                  <form onSubmit={this.createTollBoothOperator}>
                    <input
                      id="owner"
                      placeholder="owner"
                      type="text"
                      value={this.state.tollBoothOperatorInstance.owner}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <input
                      id="deposit"
                      placeholder="deposit"
                      type="number"
                      value={this.state.tollBoothOperatorInstance.deposit}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <button className="button" type="submit" disabled={!this.state.tollBoothOperatorInstance.owner && !this.state.tollBoothOperatorInstance.deposit}>
                      Create
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </main>
        );
      } else {
        return(
          <main className="container">
            <div className="pure-g">
              <div className="pure-u-1-1">
                <button onClick={this.createRegulatorInstance}>Create new regulator</button>
                <form onSubmit={this.getRegulatorFromAddress}>
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
  
  export default Regulator;