import { parseAbi } from "viem";

export const COLLATERAL_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS as `0x${string}`;
export const COUNTRY_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_COUNTRY_REGISTRY_ADDRESS as `0x${string}`;
export const COUNTRY_TRADING_ADDRESS = process.env.NEXT_PUBLIC_COUNTRY_TRADING_ADDRESS as `0x${string}`;

export const CountryRegistryAbi = parseAbi([
  "function getAllCountries() external view returns ((bytes32 countryCode, string name, address priceFeed, bool isActive)[])",
  "function getCountryPrice(bytes32 countryCode) external view returns (uint256 price, uint256 timestamp)",
]);

export const countryTradingAbi = parseAbi([
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function getCollateralBalance(address user) external view returns (uint256)",
  "function getUserPositions(address user) external view returns (uint256[])",
  "function getPosition(address user, uint256 positionId) external view returns ((bytes32 countryCode, bool isLong, uint256 collateralAmount, uint256 positionSize, uint256 entryPrice, uint256 entryTimestamp, uint256 lastFundingTimestamp))",
  "function getPositionPnL(address user, uint256 positionId) external view returns (int256 pnl, uint256 currentPrice)",
]);

export const erc20Abi = parseAbi([
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
]);