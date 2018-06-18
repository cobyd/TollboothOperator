pragma solidity ^0.4.21;

contract Regulated {
    address internal regulator;
    
    function Regulated(address _regulator) public {
        require(_regulator != 0);
        regulator = _regulator;
    }
    
    function setRegulator(address newRegulator) public onlyRegulator returns(bool success) {
        regulator = newRegulator;
        return true;
    }
    
    modifier onlyRegulator() {
        require(msg.sender == regulator);
        _;
    }
}

contract Owned {
    address internal owner;
    
    function Owned() public {
        owner = msg.sender;
    }
    
    function setOwner(address newOwner) public fromOwner returns(bool success) {
        owner = newOwner;
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

contract MultiplierHolder is Owned {
    mapping(uint => uint) public multipliers;
    
    function MultiplierHolder() public {}
    
    function setMultiplier(uint vehicleType, uint multiplier) public fromOwner returns(bool success) {
        multipliers[vehicleType] = multiplier;
        return true;
    }
    
    function getMultiplier(uint vehicleType) public constant returns(uint multiplier) {
        return multipliers[vehicleType];
    }
}

contract DepositHolder is Owned {
    uint internal deposit;
    
    function DepositHolder(uint _deposit) public {
        require(_deposit > 0);
        deposit = _deposit;
    }
    
    function setDeposit(uint depositWeis)  public fromOwner returns(bool success) {
        deposit = depositWeis;
        return true;
    }
    
    function getDeposit() constant public returns(uint weis) {
        return deposit;
    }
}

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

contract TollBoothHolder is Owned {
    mapping(address => bool) internal tollBooths;
    
    function TollBoothHolder() public {}
    
    event LogTollBoothAdded(address indexed sender, address indexed tollBooth);
    function addTollBooth(address tollBooth) public returns(bool success) {
        tollBooths[tollBooth] = true;
        emit LogTollBoothAdded(msg.sender, tollBooth);
        return true;
    }
    
    function isTollBooth(address tollBooth) constant public returns(bool isIndeed) {
        return tollBooths[tollBooth];
    }
    
    event LogTollBoothRemoved(address indexed sender, address indexed tollBooth);
    function removeTollBooth(address tollBooth) public returns(bool success) {
        tollBooths[tollBooth] = false;
        emit LogTollBoothRemoved(msg.sender, tollBooth);
        return true;
    }
}

contract RoutePriceHolder is TollBoothHolder {
    mapping(bytes32 => uint) internal routePrices;
    
    function RoutePriceHolder() public {}
    
    function setRoutePrice(address entryBooth, address exitBooth, uint priceWeis) public returns(bool success) {
        routePrices[keccak256(entryBooth, exitBooth)] = priceWeis;
        return true;
    }
    
    function getRoutePrice(address entryBooth, address exitBooth) constant public returns(uint priceWeis) {
        return routePrices[keccak256(entryBooth, exitBooth)];
    }
    
    function hashRoute(address entry, address exit) pure private returns(bytes32) {
        return keccak256(entry, exit);
    }
}

contract TollBoothOperator is Pausable, Regulated, MultiplierHolder, DepositHolder, RoutePriceHolder {
    struct VehicleOnRoad {
        address vehicle;
        address entryBooth;
        uint depositedWeis;
    }
    struct Payment {
        bytes32 exitSecretHashed;
        address entryBooth;
        address exitBooth;
    }
    mapping(bytes32 => VehicleOnRoad) internal enteredVehicles;
    mapping(bytes32 => Payment[]) internal pendingPayments;
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
        Regulator _regulator = Regulator(regulator);
        require(msg.value >= deposit);
        require(_regulator.vehicles(msg.sender) > 0);
        enteredVehicles[exitSecretHashed] = VehicleOnRoad(msg.sender, entryBooth, msg.value);
        emit LogRoadEntered(msg.sender, entryBooth, exitSecretHashed, msg.value);
        return true;
    }
    
    function getVehicleEntry(bytes32 exitSecretHashed) constant public returns(address vehicle,address entryBooth,uint depositedWeis) {
        VehicleOnRoad storage _entry = enteredVehicles[exitSecretHashed];
        return (_entry.vehicle, _entry.entryBooth, _entry.depositedWeis);
    }
    
    event LogRoadExited( address indexed exitBooth, bytes32 indexed exitSecretHashed, uint finalFee, uint refundWeis);
    event LogPendingPayment( bytes32 indexed exitSecretHashed, address indexed entryBooth, address indexed exitBooth);
    function reportExitRoad(bytes32 exitSecretClear) public whenNotPaused returns (uint status) {
        require(isTollBooth(msg.sender));
        bytes32 exitSecretHashed = hashSecret(exitSecretClear);
        VehicleOnRoad storage _entry = enteredVehicles[exitSecretHashed];
        require (_entry.vehicle > 0);
        uint price = routePrices[keccak256(_entry.entryBooth, msg.sender)];
        if (price > 0) {
            uint refund = _entry.depositedWeis - price;
            address _vehicle = _entry.vehicle;
            require(refund < _entry.depositedWeis);
            enteredVehicles[exitSecretHashed] = VehicleOnRoad(0, 0, 0);
            emit LogRoadExited(msg.sender, exitSecretHashed, price, refund);
            _vehicle.transfer(refund);
            return 1;
        } else {
            emit LogPendingPayment(exitSecretHashed, _entry.entryBooth, msg.sender);
            pendingPayments[keccak256(_entry.entryBooth, msg.sender)].push(Payment(exitSecretHashed, _entry.entryBooth, msg.sender));
            return 2;
        }
    }

    function getPendingPaymentCount(address entryBooth, address exitBooth) constant public returns (uint count) {
        return pendingPayments[keccak256(entryBooth, exitBooth)].length;
    }
    
    function clearSomePendingPayments(address entryBooth,address exitBooth,uint count) public whenNotPaused returns (bool success) {
        require(count > 0);
        bytes32 _hash = keccak256(entryBooth, exitBooth);
        uint price = routePrices[_hash];
        if (price > 0) {
            Payment[] storage payments =  pendingPayments[_hash];
            require(payments.length >= count);
            collectedFees += price * count;
            for(uint i = 0; i < count; i++) {
                Payment storage payment = payments[i];
                VehicleOnRoad storage _entry = enteredVehicles[payment.exitSecretHashed];
                uint refund = _entry.depositedWeis - price;
                address _vehicle = _entry.vehicle;
                require(refund < _entry.depositedWeis);
                delete payments[i];
                enteredVehicles[payment.exitSecretHashed] = VehicleOnRoad(0, 0, 0);
                emit LogRoadExited(msg.sender, payment.exitSecretHashed, price, refund);
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

contract Regulator is Owned {
    mapping(address => uint) public vehicles;
    mapping(address => bool) public operators;
    
    function Regulator() public {}
    
    event LogVehicleTypeSet(address indexed sender, address indexed vehicle, uint indexed vehicleType);
    
    function setVehicleType(address vehicle, uint vehicleType) public returns(bool success) {
        vehicles[vehicle] = vehicleType;
        return true;
    }
    
    function getVehicleType(address vehicle) constant public returns(uint vehicleType) {
        return vehicles[vehicle];
    }
    
    event LogTollBoothOperatorCreated(address indexed sender, address indexed newOperator, address indexed owner, uint depositWeis);
    
    function createNewOperator(address owner, uint deposit) public returns(TollBoothOperator newOperator) {
        newOperator = new TollBoothOperator(true, deposit, msg.sender);
        newOperator.setOwner(owner);
        emit LogTollBoothOperatorCreated(msg.sender, newOperator, owner, deposit);
        operators[newOperator] = true;
        return newOperator;
    }
    
    event LogTollBoothOperatorRemoved( address indexed sender, address indexed operator);
    
    function removeOperator(address operator) public returns(bool success) {
        operators[operator] = false;
        return true;
    }
    
    function isOperator(address operator) constant public returns(bool indeed) {
        return operators[operator];
    }
}