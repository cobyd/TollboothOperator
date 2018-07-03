pragma solidity ^0.4.21;
import "./Owned.sol";
import "./TollBoothOperator.sol";
import "./interfaces/RegulatorI.sol";
contract Regulator is Owned, RegulatorI {
    mapping(address => uint) public vehicles;
    mapping(address => bool) public operators;
    
    function Regulator() public {}
    
    event LogVehicleTypeSet(address indexed sender, address indexed vehicle, uint indexed vehicleType);
    
    function setVehicleType(address vehicle, uint vehicleType) public fromOwner returns(bool success) {
        vehicles[vehicle] = vehicleType;
        emit LogVehicleTypeSet(msg.sender, vehicle, vehicleType);
        return true;
    }
    
    function getVehicleType(address vehicle) constant public returns(uint vehicleType) {
        return vehicles[vehicle];
    }
    
    event LogTollBoothOperatorCreated(address indexed sender, address indexed newOperator, address indexed owner, uint depositWeis);
    
    function createNewOperator(address _owner, uint deposit) public fromOwner returns(TollBoothOperatorI _newOperator) {
        require(owner != _owner);
        TollBoothOperator newOperator = new TollBoothOperator(true, deposit, this);
        newOperator.setOwner(_owner);
        emit LogTollBoothOperatorCreated(msg.sender, newOperator, _owner, deposit);
        operators[newOperator] = true;
        return newOperator;
    }
    
    event LogTollBoothOperatorRemoved(address indexed sender, address indexed operator);
    
    function removeOperator(address operator) public fromOwner returns(bool success) {
        operators[operator] = false;
        emit LogTollBoothOperatorRemoved(msg.sender, operator);
        return true;
    }
    
    function isOperator(address operator) constant public returns(bool indeed) {
        return operators[operator];
    }
}