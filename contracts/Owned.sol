pragma solidity ^0.4.21;
import "./interfaces/OwnedI.sol";
contract Owned is OwnedI {
    address internal owner;
    
    function Owned() public {
        owner = msg.sender;
    }
    
    event LogOwnerSet(address indexed previousOwner, address indexed newOwner);
    function setOwner(address newOwner) public fromOwner returns(bool success) {
        require(newOwner != 0);
        require(newOwner != msg.sender);
        owner = newOwner;
        emit LogOwnerSet(msg.sender, newOwner);
        return true;
    }
    
    function getOwner() constant public returns(address _owner) {
        return owner;
    }
    
    modifier fromOwner() {
        require(msg.sender == owner);
        _;
    }
}