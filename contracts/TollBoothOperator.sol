pragma solidity ^0.4.21;
import "./Pausable.sol";
import "./Regulated.sol";
import "./MultiplierHolder.sol";
import "./DepositHolder.sol";
import "./RoutePriceHolder.sol";
import "./Regulator.sol";
import "./interfaces/TollBoothOperatorI.sol";
contract TollBoothOperator is Pausable, Regulated, MultiplierHolder, DepositHolder, RoutePriceHolder, TollBoothOperatorI {
    /*
     A VehicleEntry has all necessary context to process a payment
     A VehicleEntry is accessible in the mapping enteredVehicles, keyed on the entry's exit secret hash
    */
    struct VehicleEntry {
        address vehicle;
        uint multiplier;
        address entryBooth;
        uint depositedWeis;
    }

    /*
     A RouteMetadata is a store of data about a route
     - pendingPaymentCount: number of current pending payments
     - clearedPaymentCount: number of payments that were once pending, but are now settled
     - pendingPayments: mapping of index -> exit secret hash, where indices represent an ordered history of pending payments
     A RouteMetadata is accessible in the mapping routesMetadata, keyed on the hash of (entryBooth, exitBooth) for a given route
    */
    struct RouteMetadata {
        uint pendingPaymentCount;
        uint clearedPaymentCount;
        mapping(uint => bytes32) pendingPayments;
    }

    /*
     Mapping of hash(entryBooth, exitBooth) -> RouteMetadata
    */
    mapping(bytes32 => RouteMetadata) internal routesMetadata;

    /*
     Mapping of exit secret hash -> VehicleEntry
    */
    mapping(bytes32 => VehicleEntry) internal enteredVehicles;

    /*
     Current amount of wei withdrawable by the owner of the contract
    */
    uint internal collectedFees;
    
    /*
     Constructor
     - Inherits from Pausable, DepositHolder, Regulated
    */
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

    /*
     Called by vehicle
     Will roll back if:
     - Vehicle is not registered with regulator
     - Message value is not >= required deposit for given toll booth operator
     - Entry booth is not a toll booth
     - Secret has been used before
     Creates a new VehicleEntry and adds it to the mapping enteredVehicles, keyed on its exit secret hash
    */
    event LogRoadEntered( address indexed vehicle, address indexed entryBooth, bytes32 indexed exitSecretHashed, uint depositedWeis);
    function enterRoad(address entryBooth, bytes32 exitSecretHashed) public payable whenNotPaused returns (bool success) {
        require(isTollBooth(entryBooth));
        require(enteredVehicles[exitSecretHashed].vehicle == 0);
        Regulator _regulator = Regulator(getRegulator());
        uint multiplier = multipliers[_regulator.vehicles(msg.sender)];
        require(multiplier > 0);
        require(msg.value >= deposit * multiplier);
        enteredVehicles[exitSecretHashed] = VehicleEntry(msg.sender, multiplier, entryBooth, msg.value);
        emit LogRoadEntered(msg.sender, entryBooth, exitSecretHashed, msg.value);
        return true;
    }
    
    /*
     Called by a toll booth on behalf of 1 vehicle
     Will roll back if:
     - Message sender is not a valid toll booth for given toll booth operator
     - Vehicle is not registered
     - hashed exit secret does not find a valid VehicleEntry
     If a route price is set between the vehicle's entry booth and message sender:
     - Processes the payment
     Else:
     - Adds the VehicleEntry to the next available index for the route's routeMetadata
    */
    event LogRoadExited(address indexed exitBooth, bytes32 indexed exitSecretHashed, uint finalFee, uint refundWeis);
    event LogPendingPayment(bytes32 indexed exitSecretHashed, address indexed entryBooth, address indexed exitBooth);
    function reportExitRoad(bytes32 exitSecretClear) public whenNotPaused returns (uint status) {
        require(isTollBooth(msg.sender));
        bytes32 exitSecretHashed = hashSecret(exitSecretClear);
        require(
            // Any entered vehicle will exist, and have a non-zero deposit
            enteredVehicles[exitSecretHashed].vehicle != 0 &&
            enteredVehicles[exitSecretHashed].depositedWeis != 0
        );
        VehicleEntry storage _entry = enteredVehicles[exitSecretHashed];
        require(Regulator(getRegulator()).vehicles(_entry.vehicle) > 0);
        address entryBooth = _entry.entryBooth;
        require(entryBooth != msg.sender);
        uint routePrice = routePrices[keccak256(entryBooth, msg.sender)];
        if(routePrice > 0) {
            uint refund;
            uint finalFee;
            (refund, finalFee) = processPayment(exitSecretHashed, routePrice);
            emit LogRoadExited(msg.sender, exitSecretHashed, finalFee, refund);
            return 1;
        } else {
            RouteMetadata storage routeMetadata = routesMetadata[keccak256(entryBooth, msg.sender)];
            uint index = routeMetadata.pendingPaymentCount + routeMetadata.clearedPaymentCount;
            routeMetadata.pendingPayments[index] = exitSecretHashed;
            routeMetadata.pendingPaymentCount++;
            emit LogPendingPayment(exitSecretHashed, entryBooth, msg.sender);
            return 2;
        }
    }
    
    /*
     Called by anyone
     Processes {count} payments for the route between entryBooth and exitBooth
     Will roll back if:
     - count is 0
     - count is > the number of pending payments for the given route
    */
    function clearSomePendingPayments(address entryBooth, address exitBooth, uint count) public whenNotPaused returns (bool success) {
        require(count > 0);
        bytes32 _hash = keccak256(entryBooth, exitBooth);
        uint routePrice = routePrices[_hash];
        if (routePrice > 0) {
            RouteMetadata storage routeMetadata = routesMetadata[_hash];
            require(routeMetadata.pendingPaymentCount >= count);
            for(uint i = 0; i < count; i++) {
                uint paymentIndex = routeMetadata.clearedPaymentCount;
                bytes32 exitSecretHashed = routeMetadata.pendingPayments[paymentIndex];
                uint refund;
                uint finalFee;
                (refund, finalFee) = processPayment(exitSecretHashed, routePrice);
                routeMetadata.pendingPayments[paymentIndex] = bytes32(0);
                routeMetadata.pendingPaymentCount--;
                routeMetadata.clearedPaymentCount++;
                emit LogRoadExited(exitBooth, exitSecretHashed, finalFee, refund);
            }
        }
        return true;
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
    
    event LogFeesCollected( address indexed owner, uint amount);
    function withdrawCollectedFees() public returns(bool success) {
        uint toCollect = collectedFees;
        collectedFees = 0;
        owner.transfer(toCollect);
        emit LogFeesCollected(owner, toCollect);
        return true;
    }

    function getVehicleEntry(bytes32 exitSecretHashed) constant public returns(address vehicle,address entryBooth,uint depositedWeis) {
        VehicleEntry storage _entry = enteredVehicles[exitSecretHashed];
        return (_entry.vehicle, _entry.entryBooth, _entry.depositedWeis);
    }

    function getPendingPaymentCount(address entryBooth, address exitBooth) constant public returns (uint count) {
        return routesMetadata[keccak256(entryBooth, exitBooth)].pendingPaymentCount;
    }

    function getCollectedFeesAmount() constant public returns(uint amount) {
        return collectedFees;
    }

    function hashSecret(bytes32 secret) constant public returns(bytes32 hashed) {
        return keccak256(secret);
    }

    /*
     Core functionality used by any other function that processes payments
     Calculates final fee amount and refund amount
     Issues refund to vehicle where applicable
    */
    function processPayment(bytes32 exitSecretHashed, uint routePrice) private returns(uint refund, uint finalFee) {
        VehicleEntry storage _entry = enteredVehicles[exitSecretHashed];
        uint vehiclePrice = routePrice * _entry.multiplier;
        uint depositedWeis = _entry.depositedWeis;
        if(vehiclePrice > depositedWeis) {
            refund = 0;
        } else {
            refund = depositedWeis - vehiclePrice;
        }
        finalFee = depositedWeis - refund;
        collectedFees += finalFee;
        _entry.depositedWeis = 0;
        _entry.vehicle.transfer(refund);
        return(refund, finalFee);
    }

}