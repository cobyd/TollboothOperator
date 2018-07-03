import React, { Component } from "react";
import TollBoothOperatorContract from "../../build/contracts/TollBoothOperator.json";
import getWeb3 from "../../utils/getWeb3";
const toBytes32 = require("../../utils/toBytes32.js");

const Promise = require("bluebird");

class TollBoothOperator extends Component {
    constructor(props) {
      super(props);
  
      this.state = {
        accounts: [],
        netId: null,
        web3: null,
        tollBooths: [],
        routePrices: [],
        multipliers: [],
        exits: [],
        vehicleBalance: '',
        vehicleEntry: '',
        exitSecretClear: '',
        exitSecretHashed: '',
        vehicleEntries: [],
        vehicleExits: [],
        tollBoothInstance: {},
        routePriceInstance: {}, 
        multiplierInstance: {},
        exitInstance: {},
        vehicleEntryInstance: {},
        enterRoad: {},
        vehicleBalanceObj: {},
        entriesExitsInstance: {}
      };
      this.getTollBoothOperatorFromAddress = this.getTollBoothOperatorFromAddress.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.getTollBooths = this.getTollBooths.bind(this);
      this.createTollBooth = this.createTollBooth.bind(this);
      this.getRoutePrices = this.getRoutePrices.bind(this);
      this.setRoutePrice = this.setRoutePrice.bind(this);
      this.getMultipliers = this.getMultipliers.bind(this);
      this.setMultiplier = this.setMultiplier.bind(this);
      this.hash = this.hash.bind(this);
      this.getVehicleEntry = this.getVehicleEntry.bind(this);
      this.getExits = this.getExits.bind(this);
      this.reportExit = this.reportExit.bind(this);
      this.enterRoad = this.enterRoad.bind(this);
      this.pause = this.pause.bind(this);
      this.unpause = this.unpause.bind(this);
      this.getVehicleBalance = this.getVehicleBalance.bind(this);
      this.getEntriesAndExits = this.getEntriesAndExits.bind(this);
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

    async getTollBoothOperatorFromAddress() {
      const TollBoothOperator = this.state.web3.eth.contract(TollBoothOperatorContract.abi);
      const tollBoothOperatorInstance = await TollBoothOperator.at(this.state.fromAddress);
      console.log(tollBoothOperatorInstance);
      this.setState({
        tollBoothOperatorInstance: tollBoothOperatorInstance, 
        owner: await tollBoothOperatorInstance.getOwner.call({from: this.state.accounts[0]}),
        paused: await tollBoothOperatorInstance.isPaused.call({from: this.state.accounts[0]}),
        deposit: await tollBoothOperatorInstance.getDeposit.call({from: this.state.accounts[0]}).toNumber(),
      });
      console.log(this.state);
    }

    async handleChange(event) {
      console.log(event);
      if(event.target.id == 'address') {
        let stateObject = this.state;
        stateObject.tollBoothInstance[event.target.id] = event.target.value;
        this.setState(stateObject);
        console.log(this.state);
      }
      if(event.target.id == 'fromBooth' || event.target.id == 'toBooth' || event.target.id == 'price') {
        let stateObject = this.state;
        stateObject.routePriceInstance[event.target.id] = event.target.value;
        this.setState(stateObject);
        console.log(this.state);
      }
      if(event.target.id == 'vehicleEntryBooth' || event.target.id == 'vehicleAddress' || event.target.id == 'vehicleExitSecretHashed' || event.target.id == 'vehicleDepositAmount') {
        let stateObject = this.state;
        stateObject.enterRoad[event.target.id] = event.target.value;
        this.setState(stateObject);
        console.log(this.state);
      }
      if(event.target.id == 'vehicleType' || event.target.id == 'multiplier') {
        let stateObject = this.state;
        stateObject.multiplierInstance[event.target.id] = event.target.value;
        this.setState(stateObject);
        console.log(this.state);
      }
      if(event.target.id == 'fromExitBooth' || event.target.id == 'exitSecret') {
        let stateObject = this.state;
        stateObject.exitInstance[event.target.id] = event.target.value;
        this.setState(stateObject);
        console.log(this.state);
      }
      if(event.target.id == 'vehicleEntryExitSecret') {
        let stateObject = this.state;
        stateObject.vehicleEntryInstance[event.target.id] = event.target.value;
        this.setState(stateObject);
        console.log(this.state);
      }
      if(event.target.id == 'vehicleBalanceAddress') {
        let stateObject = this.state;
        stateObject.vehicleBalanceObj[event.target.id] = event.target.value;
        this.setState(stateObject);
        console.log(this.state);
      }
      if(event.target.id == 'vehicleEntriesAndExitsAddress') {
        let stateObject = this.state;
        stateObject.entriesExitsInstance[event.target.id] = event.target.value;
        this.setState(stateObject);
        console.log(this.state);
      }
      if(event.target.id == 'fromAddress' || event.target.id == 'exitSecretClear') {
        let stateObject = this.state;
        stateObject[event.target.id] = event.target.value;
        this.setState(stateObject);
        console.log(this.state);
      }
    }

    async getTollBooths() {
      this.state.tollBoothOperatorInstance.LogTollBoothAdded({}, {fromBlock: 0, toBlock: 'latest'}).get((error, logs) => {
        let tollBooths = logs.map(log => {
          return log.args.tollBooth;
        })
        this.setState({tollBooths: tollBooths})
      });
    }

    async createTollBooth() {
      const tx = this.state.tollBoothOperatorInstance.addTollBooth(
        this.state.tollBoothInstance.address,
        { from: this.state.owner, gas: 4000000 }
      );
      console.log(tx);
      this.setState({ tollBoothInstance: {} });
    }

    async getRoutePrices() {
      this.state.tollBoothOperatorInstance.LogRoutePriceSet({}, {fromBlock: 0, toBlock: 'latest'}).get((error, logs) => {
        let routePrices = logs.map(log => {
          return log.args.entryBooth + " => " + log.args.exitBooth + ", " + log.args.priceWeis;
        })
        this.setState({routePrices: routePrices})
      });
    }

    async setRoutePrice() {
      const tx = this.state.tollBoothOperatorInstance.setRoutePrice(
        this.state.routePriceInstance.fromBooth,
        this.state.routePriceInstance.toBooth,
        this.state.routePriceInstance.price,
        { from: this.state.owner, gas: 4000000 }
      );
      console.log(tx);
      this.setState({ routePriceInstance: {} });
    }

    async getMultipliers() {
      this.state.tollBoothOperatorInstance.LogMultiplierSet({}, {fromBlock: 0, toBlock: 'latest'}).get((error, logs) => {
        let multipliers = logs.map(log => {
          return log.args.vehicleType + ", " + log.args.multiplier;
        })
        this.setState({multipliers: multipliers})
      });
    }

    async setMultiplier() {
      const tx = this.state.tollBoothOperatorInstance.setMultiplier(
        this.state.multiplierInstance.vehicleType,
        this.state.multiplierInstance.multiplier,
        { from: this.state.owner, gas: 4000000 }
      );
      console.log(tx);
      this.setState({ multiplierInstance: {} });
    }

    async hash() {
      const clear = toBytes32(this.state.exitSecretClear);
      const hashed = this.state.tollBoothOperatorInstance.hashSecret.call(clear, {from: this.state.accounts[0], gas: 4000000});
      console.log(hashed);
      this.setState({exitSecretHashed: hashed});
    }

    async getExits() {
      this.state.tollBoothOperatorInstance.LogRoadExited({}, {fromBlock: 0, toBlock: 'latest'}).get((error, logs) => {
        let exits = logs.map(log => {
          return JSON.stringify(log.args);
        })
        this.setState({exits: exits})
      });
    }

    async reportExit() {
      console.log(this.state.exitInstance)
      const exitClear = toBytes32(this.state.exitInstance.exitSecret)
      const tx = this.state.tollBoothOperatorInstance.reportExitRoad(
        exitClear,
        { from: this.state.exitInstance.fromExitBooth, gas: 4000000 }
      );
      console.log(tx);
      this.setState({ exitInstance: {} });
    }

    async getVehicleEntry() {
      const tx = this.state.tollBoothOperatorInstance.getVehicleEntry.call(
        this.state.vehicleEntryInstance.vehicleEntryExitSecret,
        { from: this.state.accounts[0] }
      )
      let response = {
        vehicleAddress: tx[0],
        entryBooth: tx[1],
        depositedWeis: tx[2].toNumber()
      }
      this.setState({vehicleEntry: JSON.stringify(response)})
    }

    async enterRoad() {
      console.log(this.state.enterRoad)
      const tx = this.state.tollBoothOperatorInstance.enterRoad(
        this.state.enterRoad.vehicleEntryBooth,
        this.state.enterRoad.vehicleExitSecretHashed,
        { from: this.state.enterRoad.vehicleAddress, gas: 4000000, value: this.state.enterRoad.vehicleDepositAmount }
      );
      console.log(tx);
      this.setState({ exitInstance: {} });
    }

    async pause() {
      const tx = await this.state.tollBoothOperatorInstance.setPaused(
        true,
        {from: this.state.owner, gas: 4000000}
      )
      console.log(tx)
      this.setState({paused: true})
    }

    async unpause() {
      const tx = await this.state.tollBoothOperatorInstance.setPaused(
        false,
        {from: this.state.owner, gas: 4000000}
      )
      console.log(tx)
      this.setState({paused: true})
    }

    async getVehicleBalance() {
      const balance = await this.state.web3.eth.getBalancePromise(this.state.vehicleBalanceObj.vehicleBalanceAddress)
      this.setState({vehicleBalance: this.state.web3.fromWei(balance.toNumber(), "ether" )})
    }

    async getEntriesAndExits() {
      this.setState({vehicleEntries: [], vehicleExits: []})
      this.state.tollBoothOperatorInstance.LogRoadEntered(
        {vehicle: this.state.entriesExitsInstance.vehicleEntriesAndExitsAddress}, 
        {fromBlock: 0, toBlock: 'latest'}
      ).get((error, logs) => {
          let entries = logs.map(log => {
            return JSON.stringify(log.args);
          })
          this.setState({vehicleEntries: entries})
          let exits = []
          entries.forEach(entry => {
            let hash = JSON.parse(entry).exitSecretHashed
            this.state.tollBoothOperatorInstance.LogRoadExited(
              {exitSecretHashed: hash},
              {fromBlock: 0, toBlock: 'latest'}
            ).get((error, logs) => {
              console.log(logs)
              logs.forEach(log => {
                exits.push(JSON.stringify(log.args))
              })
              this.setState({vehicleExits: exits})
            })
          })
      });
    }
  
    render() {
      if (this.state.tollBoothOperatorInstance) {
        return (
          <main className="container">
            <div className="pure-g">
              <div className="pure-u-1-1">
                <div className="functionality">
                  Tollbooth Operator Address: {this.state.tollBoothOperatorInstance.address}
                  Tollbooth Operator Owner: {this.state.owner}
                  Tollbooth Operator Pause State: {this.state.paused}
                  Tollbooth Operator Deposit: {this.state.deposit}
                  <button onClick={this.unpause}>Unpause</button>
                  <button onClick={this.pause}>Pause</button>
                </div>
                <div className="functionality">
                  Toll Booths: <button onClick={this.getTollBooths}>Get Toll Boths</button>
                  {this.state.tollBooths.join(",")}
                </div>
                <div className="functionality">
                  Create Toll Booth:
                  <form onSubmit={this.createTollBooth}>
                    <input
                      id="address"
                      placeholder="address"
                      type="text"
                      value={this.state.tollBoothInstance.address}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <button className="button" type="submit" disabled={!this.state.tollBoothInstance.address}>
                      Create
                    </button>
                  </form>
                </div>
                <div className="functionality">
                  Route Prices: <button onClick={this.getRoutePrices}>Get Route Prices</button>
                  {this.state.routePrices.join(";")}
                </div>
                <div className="functionality">
                  Hash Secret: <form onSubmit={this.hash}>
                    <input
                      id="exitSecretClear"
                      placeholder="exitSecretClear"
                      type="number"
                      value={this.state.exitSecretClear}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <button className="button" type="submit" disabled={!this.state.exitSecretClear}>
                      Hash
                    </button>
                  </form>
                  Hashed: {this.state.exitSecretHashed}
                </div>
                <div className="functionality">
                  Set Route Price
                  <form onSubmit={this.setRoutePrice}>
                    <input
                      id="fromBooth"
                      placeholder="fromBooth"
                      type="text"
                      value={this.state.routePriceInstance.fromBooth}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <input
                      id="toBooth"
                      placeholder="toBooth"
                      type="text"
                      value={this.state.routePriceInstance.toBooth}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <input
                      id="price"
                      placeholder="price"
                      type="number"
                      value={this.state.routePriceInstance.price}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <button className="button" type="submit" disabled={!this.state.routePriceInstance.fromBooth && 
                                                                       !this.state.routePriceInstance.toBooth &&
                                                                       !this.state.routePriceInstance.price}>
                      Set
                    </button>
                  </form>
                </div>
                <div className="functionality">
                  Multipliers: <button onClick={this.getMultipliers}>Get Multipliers</button>
                  {this.state.multipliers.join(";")}
                </div>
                <div className="functionality">
                  Set Multiplier:
                  <form onSubmit={this.setMultiplier}>
                    <input
                      id="vehicleType"
                      placeholder="vehicleType"
                      type="text"
                      value={this.state.multiplierInstance.vehicleType}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <input
                      id="multiplier"
                      placeholder="multiplier"
                      type="text"
                      value={this.state.multiplierInstance.multiplier}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <button className="button" type="submit" disabled={!this.state.multiplierInstance.vehicleType && !this.state.multiplierInstance.multiplier}>
                      Set
                    </button>
                  </form>
                </div>
                <div className="functionality">
                  Exits: <button onClick={this.getExits}>Get Exits</button>
                  {this.state.exits.join(";")}
                </div>
                <div className="functionality">
                  Report Exit:
                  <form onSubmit={this.reportExit}>
                    <input
                      id="fromExitBooth"
                      placeholder="fromExitBooth"
                      type="text"
                      value={this.state.exitInstance.fromExitBooth}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <input
                      id="exitSecret"
                      placeholder="exitSecretClear"
                      type="number"
                      value={this.state.exitInstance.exitSecret}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <button className="button" type="submit" disabled={!this.state.exitInstance.fromExitBooth && !this.state.exitInstance.exitSecret}>
                      Report
                    </button>
                  </form>
                </div>
                <div className="functionality">
                  Check Status of Vehicle Entry
                  <form onSubmit={this.getVehicleEntry}>
                    <input
                      id="vehicleEntryExitSecret"
                      placeholder="exitSecretHashed"
                      type="text"
                      value={this.state.vehicleEntryInstance.vehicleEntryExitSecret}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <button className="button" type="submit" disabled={!this.state.vehicleEntryInstance.vehicleEntryExitSecret}>
                      Check
                    </button>
                  </form>
                  Status: {this.state.vehicleEntry}
                </div>
                <div className="functionality">
                  Enter Road:
                  <form onSubmit={this.enterRoad}>
                    <input
                      id="vehicleAddress"
                      placeholder="vehicleAddress"
                      type="text"
                      value={this.state.enterRoad.vehicleAddress}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <input
                      id="vehicleEntryBooth"
                      placeholder="vehicleEntryBooth"
                      type="text"
                      value={this.state.enterRoad.vehicleEntryBooth}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <input
                      id="vehicleExitSecretHashed"
                      placeholder="vehicleExitSecretHashed"
                      type="text"
                      value={this.state.enterRoad.vehicleExitSecretHashed}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <input
                      id="vehicleDepositAmount"
                      placeholder="vehicleDepositAmount"
                      type="number"
                      value={this.state.enterRoad.vehicleDepositAmount}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <button className="button" type="submit" disabled={!this.state.enterRoad.vehicleAddress &&
                                                                       !this.state.enterRoad.vehicleEntryBooth &&
                                                                       !this.state.enterRoad.vehicleExitSecretHashed &&
                                                                       !this.state.enterRoad.vehicleDepositAmount}>
                      Enter
                    </button>
                  </form>
                </div>
                <div className="functionality">
                  Check Balance of Vehicle
                  <form onSubmit={this.getVehicleBalance}>
                    <input
                      id="vehicleBalanceAddress"
                      placeholder="vehicleBalanceAddress"
                      type="text"
                      value={this.state.vehicleBalanceObj.vehicleBalanceAddress}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <button className="button" type="submit" disabled={!this.state.vehicleBalanceObj.vehicleBalanceAddress}>
                      Check
                    </button>
                  </form>
                  Balance: {this.state.vehicleBalance}
                </div>
                <div className="functionality">
                  Get entries and exits for vehicle:
                  <form onSubmit={this.getEntriesAndExits}>
                    <input
                      id="vehicleEntriesAndExitsAddress"
                      placeholder="vehicleEntriesAndExitsAddress"
                      type="text"
                      value={this.state.entriesExitsInstance.vehicleEntriesAndExitsAddress}
                      autoComplete="off"
                      onChange={this.handleChange}
                    />
                    <button className="button" type="submit" disabled={!this.state.entriesExitsInstance.vehicleEntriesAndExitsAddress}>
                      Get
                    </button>
                  </form>
                  <div className="functionality">Entries: {this.state.vehicleEntries}</div>
                  <div className="functionality">Exits: {this.state.vehicleExits}</div>
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
                <form onSubmit={this.getTollBoothOperatorFromAddress}>
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
  
  export default TollBoothOperator;
  