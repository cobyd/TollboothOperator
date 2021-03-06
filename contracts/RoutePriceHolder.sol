pragma solidity ^0.4.21;
import "./Owned.sol";
import "./interfaces/RoutePriceHolderI.sol";
import "./TollBoothHolder.sol";
contract RoutePriceHolder is TollBoothHolder, RoutePriceHolderI {
    mapping(bytes32 => uint) internal routePrices;
    
    function RoutePriceHolder() public {}
    
    event LogRoutePriceSet(address indexed sender, address indexed entryBooth, address indexed exitBooth, uint priceWeis);
    function setRoutePrice(address entryBooth, address exitBooth, uint priceWeis) public fromOwner returns(bool success) {
        require(entryBooth > 0 && exitBooth > 0);
        require(entryBooth != exitBooth);
        require(isTollBooth(entryBooth) && isTollBooth(exitBooth));
        bytes32 routeHash = keccak256(entryBooth, exitBooth);
        require(routePrices[routeHash] != priceWeis);
        routePrices[routeHash] = priceWeis;
        emit LogRoutePriceSet(msg.sender, entryBooth, exitBooth, priceWeis);
        return true;
    }
    
    function getRoutePrice(address entryBooth, address exitBooth) constant public returns(uint priceWeis) {
        return routePrices[keccak256(entryBooth, exitBooth)];
    }
    
    function hashRoute(address entry, address exit) pure private returns(bytes32) {
        return keccak256(entry, exit);
    }
}