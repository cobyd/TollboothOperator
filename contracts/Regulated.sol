pragma solidity ^0.4.21;
import "./interfaces/RegulatedI.sol";
contract Regulated is RegulatedI {
    address internal regulator;
    
    function Regulated(address _regulator) public {
        require(_regulator != 0);
        regulator = _regulator;
    }
    
    event LogRegulatorSet(address indexed previousRegulator, address indexed newRegulator);
    function setRegulator(address newRegulator) public onlyRegulator returns(bool success) {
        emit LogRegulatorSet(regulator, newRegulator);
        regulator = newRegulator;
        return true;
    }

    function getRegulator() constant public returns(RegulatorI _regulator) {
        return RegulatorI(regulator);
    }
    
    modifier onlyRegulator() {
        require(msg.sender == regulator);
        _;
    }
}