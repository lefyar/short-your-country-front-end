// config/contractTrade.ts
import { parseAbi } from 'viem'

export const COUNTRY_TRADING_ADDRESS =
    '0x57Df258deA444B94a82669DF1E6fbFD35BED8cF0' as `0x${string}`

export const countryTradingAbi = parseAbi([
    'function openLongPosition(bytes32 countryCode,uint256 collateralAmount) external returns (uint256)',
    'function openShortPosition(bytes32 countryCode,uint256 collateralAmount) external returns (uint256)',
])
