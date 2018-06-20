const Promise = require("bluebird");
Promise.promisifyAll(web3, { suffix: "Promise" });

const randomIntIn = require("../utils/randomIntIn.js");
const toBytes32 = require("../utils/toBytes32.js");

if (typeof web3.eth.getAccountsPromise === "undefined") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

const Regulator = artifacts.require("./Regulator.sol");
const TollBoothOperator = artifacts.require("./TollBoothOperator.sol");


contract("Scenarios", accounts => {
    let owner0;
    let owner1;
    let vehicle0;
    let vehicle1;
    let booth0;
    let booth1;
    let deposit0;
    let regulator;
    let vehicleType0;
    let vehicleType1;
    let price0;
    let multiplier0;
    let multiplier1;
    let secret0 = toBytes32(1);
    let secret1 = toBytes32(2);;
    let hashed0;
    let hashed1;
    let tollBoothOperator;

    before("Should set variables with values", () => {
        assert.isAtLeast(accounts.length, 6);
        owner0 = accounts[0];
        owner1 = accounts[1];
        vehicle0 = accounts[2];
        vehicle1 = accounts[3];
        booth0 = accounts[4];
        booth1 = accounts[5];
        deposit0 = 10;
        vehicleType0 = 1;
        vehicleType1 = 2;
        price0 = 1;
        multiplier0 = 32;
        multiplier1 = 21;
        return web3.eth.getBalancePromise(owner0).then(balance => {
            assert.isAtLeast(web3.fromWei(balance).toNumber(), 10);
        })
    });

    beforeEach("Should deploy the necessary contracts", () => {
        return regulator = Regulator.new({ from: owner0 })
            .then(instance => regulator = instance)
            .then(() => regulator.setVehicleType(vehicle0, vehicleType0, { from: owner0 }))
            .then(tx => regulator.setVehicleType(vehicle1, vehicleType1, { from: owner0 }))
            .then(tx => regulator.createNewOperator(owner1, deposit0, { from: owner0 }))
            .then(tx => tollBoothOperator = TollBoothOperator.at(tx.logs[1].args.newOperator))
            .then(() => tollBoothOperator.addTollBooth(booth0, { from: owner1 }))
            .then(tx => tollBoothOperator.addTollBooth(booth1, { from: owner1 }))
            .then(tx => tollBoothOperator.setMultiplier(vehicleType0, multiplier0, { from: owner1 }))
            .then(tx => tollBoothOperator.setMultiplier(vehicleType1, multiplier1, { from: owner1 }))
            .then(tx => tollBoothOperator.setRoutePrice(booth0, booth1, price0, { from: owner1 }))
            .then(tx => tollBoothOperator.setPaused(false, { from: owner1 }))
            .then(tx => tollBoothOperator.hashSecret(secret0))
            .then(hash => hashed0 = hash)
            .then(tx => tollBoothOperator.hashSecret(secret1))
            .then(hash => hashed1 = hash);
    });

    it("scenario 1 - Routeprice is equal to deposit, no refund", () => {
        return tollBoothOperator.enterRoad.call(
            booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0)})
        .then(success => assert.isOk(success))
        .then(() => tollBoothOperator.enterRoad(
            booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0)}))
        .then(tx => assert.isOk(tx.receipt))
        .then(() => tollBoothOperator.setRoutePrice(booth0, booth1, deposit0, { from: owner1 }))
        .then(tx => tollBoothOperator.reportExitRoad.call(secret0, { from: booth1 }))
        .then(success => assert.isOk(success))
        .then(() => tollBoothOperator.reportExitRoad(secret0, { from: booth1 }))
        .then(tx => assert.equal(0, tx.logs[0].args.refundWeis.toNumber()))
    });
    it("scenario 2 - Routeprice is greater than deposit, no refund", () => {
        return tollBoothOperator.enterRoad.call(
            booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0)})
        .then(success => assert.isOk(success))
        .then(() => tollBoothOperator.enterRoad(
            booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0)}))
        .then(tx => assert.isOk(tx.receipt))
        .then(() => tollBoothOperator.setRoutePrice(booth0, booth1, deposit0 * 2, { from: owner1 }))
        .then(tx => tollBoothOperator.reportExitRoad.call(secret0, { from: booth1 }))
        .then(success => assert.isOk(success))
        .then(() => tollBoothOperator.reportExitRoad(secret0, { from: booth1 }))
        .then(tx => assert.equal(0, tx.logs[0].args.refundWeis.toNumber()))
    });
    
    it("scenario 3 - Routeprice is less than deposit, refund is issued", () => {
        return tollBoothOperator.enterRoad.call(
            booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0)})
        .then(success => assert.isOk(success))
        .then(() => tollBoothOperator.enterRoad(
            booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0)}))
        .then(tx => assert.isOk(tx.receipt))
        .then(() => tollBoothOperator.setRoutePrice(booth0, booth1, deposit0 - 2, { from: owner1 }))
        .then(tx => tollBoothOperator.reportExitRoad.call(secret0, { from: booth1 }))
        .then(success => assert.isOk(success))
        .then(() => tollBoothOperator.reportExitRoad(secret0, { from: booth1 }))
        .then(tx => assert.equal(2 * multiplier0, tx.logs[0].args.refundWeis.toNumber()))
    });
    
    it("scenario 4 - Amount Deposited is greater than deposit, routeprice equals deposit, refund is issued", () => {
        return tollBoothOperator.enterRoad.call(
            booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0 + 5 * multiplier0)})
        .then(success => assert.isOk(success))
        .then(() => tollBoothOperator.enterRoad(
            booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0 + 5 * multiplier0)}))
        .then(tx => assert.isOk(tx.receipt))
        .then(() => tollBoothOperator.setRoutePrice(booth0, booth1, deposit0, { from: owner1 }))
        .then(tx => tollBoothOperator.reportExitRoad.call(secret0, { from: booth1 }))
        .then(success => assert.isOk(success))
        .then(() => tollBoothOperator.reportExitRoad(secret0, { from: booth1 }))
        .then(tx => assert.equal(5 * multiplier0, tx.logs[0].args.refundWeis.toNumber()))
    });
    
    it("scenario 5 - Amount Deposited is greater than deposit, routeprice is greater than deposit, refund is issued", () => {
        return tollBoothOperator.enterRoad.call(
            booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0 + 5 * multiplier0)})
        .then(success => assert.isOk(success))
        .then(() => tollBoothOperator.enterRoad(
            booth0, hashed0, { from: vehicle0, value: (deposit0 * multiplier0 + 5 * multiplier0)}))
        .then(tx => assert.isOk(tx.receipt))
        .then(() => tollBoothOperator.setRoutePrice(booth0, booth1, deposit0 + 1, { from: owner1 }))
        .then(tx => tollBoothOperator.reportExitRoad.call(secret0, { from: booth1 }))
        .then(success => assert.isOk(success))
        .then(() => tollBoothOperator.reportExitRoad(secret0, { from: booth1 }))
        .then(tx => assert.equal(4 * multiplier0, tx.logs[0].args.refundWeis.toNumber()))
    });
    
    it("scenario 6 - FIFO queue test case", () => {
        return tollBoothOperator.enterRoad.call(
            booth1, hashed0, { from: vehicle0, value: (deposit0 * multiplier0 + 5 * multiplier0)})
        .then(success => assert.isOk(success))
        .then(() => tollBoothOperator.enterRoad(
            booth1, hashed0, { from: vehicle0, value: (deposit0 * multiplier0 + 5 * multiplier0)}))
        .then(tx => assert.isOk(tx.receipt))
        .then(tx => tollBoothOperator.reportExitRoad.call(secret0, { from: booth0 }))
        .then(success => assert.isOk(success))
        .then(() => tollBoothOperator.reportExitRoad(secret0, { from: booth0 }))
        .then(tx => tollBoothOperator.enterRoad.call(
            booth1, hashed1, { from: vehicle1, value: (deposit0 * multiplier1)}))
        .then(success => assert.isOk(success))
        .then(() => tollBoothOperator.enterRoad(
            booth1, hashed1, { from: vehicle1, value: (deposit0 * multiplier1)}))
        .then(tx => assert.isOk(tx.receipt))
        .then(tx => tollBoothOperator.reportExitRoad.call(secret1, { from: booth0 }))
        .then(success => assert.isOk(success))
        .then(() => tollBoothOperator.reportExitRoad(secret1, { from: booth0 }))
        .then(tx => tollBoothOperator.setRoutePrice(booth1, booth0, deposit0 - 3, { from: owner1 }))
        .then(tx => {
            assert.equal(8 * multiplier0, tx.logs[1].args.refundWeis.toNumber());
        })
        .then(() => tollBoothOperator.clearSomePendingPayments(booth1, booth0, 1))
        .then(tx => assert.equal(3 * multiplier1, tx.logs[0].args.refundWeis.toNumber()))
    });
});
