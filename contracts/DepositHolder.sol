pragma solidity ^0.4.21;
import "./Owned.sol";
import "./interfaces/DepositHolderI.sol";
contract DepositHolder is Owned, DepositHolderI {
    uint internal deposit;
    
    function DepositHolder(uint _deposit) public {
        require(_deposit > 0);
        deposit = _deposit;
    }
    
    event LogDepositSet(address indexed sender, uint depositWeis);
    function setDeposit(uint depositWeis)  public fromOwner returns(bool success) {
        deposit = depositWeis;
        emit LogDepositSet(msg.sender, depositWeis);
        return true;
    }
    
    function getDeposit() constant public returns(uint weis) {
        return deposit;
    }
}