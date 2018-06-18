pragma solidity ^0.4.21;
import "./Owned.sol";
import "./interfaces/PausableI.sol";
contract Pausable is Owned {
    bool internal paused;
    
    function Pausable(bool initialPausedState) public {
        paused = initialPausedState;
    }
    
    event LogPausedSet(address indexed sender, bool indexed newPausedState);
    function setPaused(bool newState) public returns(bool success) {
        paused = newState;
        emit LogPausedSet(msg.sender, newState);
        return true;
    }
    
    function isPaused() constant public returns(bool isIndeed) {
        return paused;
    }
    
    modifier whenPaused() {
        require(paused);
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused);
        _;
    }
}