pragma solidity ^0.4.21;
import "./Owned.sol";
import "./interfaces/MultiplierHolderI.sol";
contract MultiplierHolder is Owned, MultiplierHolderI {
    mapping(uint => uint) internal multipliers;
    
    function MultiplierHolder() public {}
    
    event LogMultiplierSet(address indexed sender, uint indexed vehicleType, uint multiplier);
    function setMultiplier(uint vehicleType, uint multiplier) public fromOwner returns(bool success) {
        require(vehicleType > 0);
        require(multipliers[vehicleType] != multiplier);
        multipliers[vehicleType] = multiplier;
        emit LogMultiplierSet(msg.sender, vehicleType, multiplier);
        return true;
    }
    
    function getMultiplier(uint vehicleType) public constant returns(uint multiplier) {
        return multipliers[vehicleType];
    }
}