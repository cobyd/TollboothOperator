pragma solidity ^0.4.21;
import "./Pausable.sol";
import "./Regulated.sol";
import "./MultiplierHolder.sol";
import "./DepositHolder.sol";
import "./RoutePriceHolder.sol";
import "./Regulator.sol";
import "./interfaces/TollBoothOperatorI.sol";
contract TollBoothOperator is Pausable, Regulated, MultiplierHolder, DepositHolder, RoutePriceHolder, TollBoothOperatorI {
    struct VehicleOnRoad {
        address vehicle;
        uint multiplier;
        address entryBooth;
        uint depositedWeis;
    }
    struct RouteMetadata {
        uint pendingPaymentCount;
        uint clearedPaymentCount;
        mapping(uint => bytes32) pendingPayments;
    }
    mapping(bytes32 => RouteMetadata) internal routesMetadata;
    mapping(bytes32 => VehicleOnRoad) internal enteredVehicles;
    uint internal collectedFees;
    
    function TollBoothOperator(bool initialPauseState, uint _deposit, address _regulator) 
    Pausable(initialPauseState) 
    DepositHolder(_deposit)
    Regulated(_regulator) public {
        paused = initialPauseState;
        deposit = _deposit;
        regulator = _regulator;
    }

    function () public {
        revert();
    }
    
    function hashSecret(bytes32 secret) constant public returns(bytes32 hashed) {
        return keccak256(secret);
    }
    
    event LogRoadEntered( address indexed vehicle, address indexed entryBooth, bytes32 indexed exitSecretHashed, uint depositedWeis);
    
    function enterRoad(address entryBooth, bytes32 exitSecretHashed) public payable whenNotPaused returns (bool success) {
        Regulator _regulator = Regulator(getRegulator());
        uint multiplier = multipliers[_regulator.vehicles(msg.sender)];
        require(multiplier > 0);
        require(msg.value >= deposit * multiplier);
        enteredVehicles[exitSecretHashed] = VehicleOnRoad(msg.sender, multiplier, entryBooth, msg.value);
        emit LogRoadEntered(msg.sender, entryBooth, exitSecretHashed, msg.value);
        return true;
    }
    
    function getVehicleEntry(bytes32 exitSecretHashed) constant public returns(address vehicle,address entryBooth,uint depositedWeis) {
        VehicleOnRoad storage _entry = enteredVehicles[exitSecretHashed];
        return (_entry.vehicle, _entry.entryBooth, _entry.depositedWeis);
    }
    
    event LogRoadExited(address indexed exitBooth, bytes32 indexed exitSecretHashed, uint finalFee, uint refundWeis);
    event LogPendingPayment(bytes32 indexed exitSecretHashed, address indexed entryBooth, address indexed exitBooth);
    function reportExitRoad(bytes32 exitSecretClear) public whenNotPaused returns (uint status) {
        require(isTollBooth(msg.sender));
        bytes32 exitSecretHashed = hashSecret(exitSecretClear);
        VehicleOnRoad storage _entry = enteredVehicles[exitSecretHashed];
        require (_entry.vehicle > 0);
        uint price = routePrices[keccak256(_entry.entryBooth, msg.sender)] * _entry.multiplier;
        if (price > 0) {
            uint refund;
            if(price >= _entry.depositedWeis) {
                price = _entry.depositedWeis;
            } else {
                refund = _entry.depositedWeis - price;
                require(refund + price == _entry.depositedWeis);
            }
            address _vehicle = _entry.vehicle;
            require(refund < _entry.depositedWeis);
            collectedFees += _entry.depositedWeis - refund;
            _entry.depositedWeis = 0;
            emit LogRoadExited(msg.sender, exitSecretHashed, price, refund);
            _vehicle.transfer(refund);
            return 1;
        } else {
            emit LogPendingPayment(exitSecretHashed, _entry.entryBooth, msg.sender);
            RouteMetadata storage routeMetadata = routesMetadata[keccak256(_entry.entryBooth, msg.sender)];
            uint index = routeMetadata.pendingPaymentCount + routeMetadata.clearedPaymentCount;
            routeMetadata.pendingPayments[index] = exitSecretHashed;
            routeMetadata.pendingPaymentCount++;
            return 2;
        }
    }

    function getPendingPaymentCount(address entryBooth, address exitBooth) constant public returns (uint count) {
        return routesMetadata[keccak256(entryBooth, exitBooth)].pendingPaymentCount;
    }

    function setRoutePrice(address entryBooth, address exitBooth, uint priceWeis) public fromOwner returns(bool success) {
        super.setRoutePrice(entryBooth, exitBooth, priceWeis);
        bytes32 _hash = keccak256(entryBooth, exitBooth);
        uint pendingPaymentCount = routesMetadata[_hash].pendingPaymentCount;
        if (pendingPaymentCount > 0) {
            clearSomePendingPayments(entryBooth, exitBooth, 1);
        }
        return true;
    }
    
    function clearSomePendingPayments(address entryBooth, address exitBooth, uint count) public whenNotPaused returns (bool success) {
        require(count > 0);
        bytes32 _hash = keccak256(entryBooth, exitBooth);
        uint price = routePrices[_hash];
        if (price > 0) {
            RouteMetadata storage routeMetadata = routesMetadata[_hash];
            require(routeMetadata.pendingPaymentCount >= count);
            for(uint i = 0; i < count; i++) {
                uint paymentIndex = routeMetadata.clearedPaymentCount;
                bytes32 exitSecretHashed = routeMetadata.pendingPayments[paymentIndex];
                VehicleOnRoad storage _entry = enteredVehicles[exitSecretHashed];
                uint vehiclePrice = price * _entry.multiplier;
                uint refund;
                if(vehiclePrice > _entry.depositedWeis) {
                    vehiclePrice = _entry.depositedWeis;
                } else {
                    refund = _entry.depositedWeis - vehiclePrice;
                    require(refund + vehiclePrice == _entry.depositedWeis);
                }
                require(refund < _entry.depositedWeis);
                collectedFees += _entry.depositedWeis - refund;
                _entry.depositedWeis = 0;
                routeMetadata.pendingPayments[paymentIndex] = bytes32(0);
                routeMetadata.pendingPaymentCount--;
                routeMetadata.clearedPaymentCount++;
                emit LogRoadExited(exitBooth, exitSecretHashed, vehiclePrice, refund);
                address _vehicle = _entry.vehicle;
                _vehicle.transfer(refund);
            }
        }
        return true;
    }
    
    function getCollectedFeesAmount() constant public returns(uint amount) {
        return collectedFees;
    }
    
    event LogFeesCollected( address indexed owner, uint amount);
    
    function withdrawCollectedFees() public returns(bool success) {
        uint toCollect = collectedFees;
        collectedFees = 0;
        owner.transfer(toCollect);
        emit LogFeesCollected(owner, toCollect);
        return true;
    }

}