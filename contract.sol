// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract PredictionMarket is ERC20, Ownable {
    using SafeMath for uint256;

    uint256 public s_maxSupply = 55555555 * 10 ** 18;

    // Define variables
    address public aiModel;
    uint256 public feePercentage;
    uint256 public tokensPerETH;
    address public rewardTokenAddress;
    address public tokenAddress;
    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public stakingRewards;
    mapping(address => bool) private _locked;

    // Events
    event PredictionMade(address indexed user, uint256 amount, bool prediction);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);
    event StakingRewardsClaimed(address indexed user, uint256 amount);
    event ExchangeRateUpdated(uint256 newRate);
    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);

    // Constructor
    constructor(address initialOwner, address _aiModel, uint256 _feePercentage, uint256 _initialTokensPerETH) Ownable(initialOwner) ERC20("PredictionMarket", "PM") {
        aiModel = _aiModel;
        feePercentage = _feePercentage;
        tokensPerETH = _initialTokensPerETH;
        _mint(initialOwner, s_maxSupply);
        _mint(address(this), s_maxSupply);
        rewardTokenAddress = address(this); 
    }


    function newRewardsContract(address newTokenAddress) public onlyOwner{
        rewardTokenAddress = newTokenAddress;
    }
    

    // Prediction function
    function makePrediction(uint256 amount, bool prediction) external {
        require(msg.sender == aiModel, "Only AI model can make predictions");
        // Implement prediction logic here
        emit PredictionMade(msg.sender, amount, prediction);
    }

    // Buy function
    function buy(uint256 amount) external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(amount > 0, "Token amount must be greater than 0");
        uint256 fee = msg.value.mul(feePercentage).div(100);
        uint256 amountAfterFee = msg.value.sub(fee);

        // Calculate the token amount based on the current token price and the specified amount
        uint256 tokenAmount = amount;
        require(tokenAmount.mul(tokensPerETH) == amountAfterFee, "Incorrect token amount");

        _mint(msg.sender, tokenAmount);

        payable(owner()).transfer(fee);
    }

    // Sell function
    function sell(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Calculate the equivalent Ether amount based on the current token price
        uint256 ethAmount = amount.div(tokensPerETH);
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(ethAmount);
    }

    // Stake function
    function stake(uint256 amount) external {
        require(amount > 0, "Stake amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Transfer tokens from user to contract
        _transfer(msg.sender, address(this), amount);

        // Update staked balance
        stakedBalances[msg.sender] = stakedBalances[msg.sender].add(amount);

        emit TokensStaked(msg.sender, amount);
    }

    // Unstake function with reentrancy guard
    function unstake(uint256 amount) external {
        require(amount > 0, "Unstake amount must be greater than 0");
        require(stakedBalances[msg.sender] >= amount, "Insufficient staked balance");
        require(!_locked[msg.sender], "Reentrancy guard: locked");
        _locked[msg.sender] = true;

        // Update staked balance
        stakedBalances[msg.sender] = stakedBalances[msg.sender].sub(amount);

        // Transfer tokens from contract to user
        _transfer(address(this), msg.sender, amount);

        emit TokensUnstaked(msg.sender, amount);

        _locked[msg.sender] = false;
    }

    // Function to claim staking rewards
    function claimStakingRewards() external {
        uint256 reward = calculateStakingReward(msg.sender);
        require(reward > 0, "No rewards to claim");

        // Transfer rewards to user
        _mint(msg.sender, reward);

        // Update staking rewards mapping
        stakingRewards[msg.sender] = 0;

        emit StakingRewardsClaimed(msg.sender, reward);
    }

    // Internal function to calculate staking rewards for a user
    function calculateStakingReward(address user) internal view returns (uint256) {
        // Implement your staking rewards calculation logic here
        // This is just a placeholder
        return stakedBalances[user].mul(1).div(100); // Dummy calculation for demonstration
    }

    // Function to update the token price
    function updateTokenPrice(uint256 newPrice) external onlyOwner {
        tokensPerETH = newPrice;
        emit ExchangeRateUpdated(newPrice);
    }

    // Function to allow users to purchase tokens by sending Ether
    function purchaseTokens(uint256 amount) external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(amount > 0, "Token amount must be greater than 0");

        // Calculate the token amount based on the specified amount and the current token price
        uint256 tokenAmount = amount;
        uint256 ethAmount = tokenAmount.div(tokensPerETH);
        require(msg.value == ethAmount, "Incorrect Ether amount");

        _mint(msg.sender, tokenAmount);

        emit TokensPurchased(msg.sender, msg.value, tokenAmount);
    }

    }