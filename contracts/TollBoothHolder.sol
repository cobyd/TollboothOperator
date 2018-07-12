pragma solidity ^0.4.21;
import "./Owned.sol";
import "./interfaces/TollBoothHolderI.sol";
contract TollBoothHolder is Owned, TollBoothHolderI {
    mapping(address => bool) internal tollBooths;
    
    function TollBoothHolder() public {}
    
    event LogTollBoothAdded(address indexed sender, address indexed tollBooth);
    function addTollBooth(address tollBooth) public fromOwner returns(bool success) {
        require(tollBooth > 0);
        require(!isTollBooth(tollBooth));
        tollBooths[tollBooth] = true;
        emit LogTollBoothAdded(msg.sender, tollBooth);
        return true;
    }
    
    function isTollBooth(address tollBooth) constant public returns(bool isIndeed) {
        return tollBooths[tollBooth];
    }
    
    event LogTollBoothRemoved(address indexed sender, address indexed tollBooth);
    function removeTollBooth(address tollBooth) public fromOwner returns(bool success) {
        require(tollBooth > 0);
        require(isTollBooth(tollBooth));
        tollBooths[tollBooth] = false;
        emit LogTollBoothRemoved(msg.sender, tollBooth);
        return true;
    }
}