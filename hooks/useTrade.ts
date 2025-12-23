import {
    useWriteContract,
} from "wagmi";
import {
    COUNTRY_TRADING_ADDRESS,
} from "@/config/contracts";
import {
    countryTradingAbi,
} from "@/config/contractTrade";
import { parseUnits, stringToHex, keccak256 } from "viem";

export function useTrade() {
    const { writeContractAsync } = useWriteContract();

    const handleOpenLong = async (amountStr: string = "5", countryCodeStr: string) => {
        try {
            const amount = parseUnits(amountStr, 18);

            const countryCode = keccak256(stringToHex(countryCodeStr));

            const tx = await writeContractAsync({
                address: COUNTRY_TRADING_ADDRESS,
                abi: countryTradingAbi,
                functionName: "openLongPosition",
                args: [countryCode, amount],
            });

            return tx;
        } catch (error) {
            console.error("Long Error:", error);
            throw error;
        }
    };
    const handleOpenShort = async (amountStr: string = "5", countryCodeStr: string) => {
        try {
            const amount = parseUnits(amountStr, 18);

            const countryCode = keccak256(stringToHex(countryCodeStr));

            const tx = await writeContractAsync({
                address: COUNTRY_TRADING_ADDRESS,
                abi: countryTradingAbi,
                functionName: "openShortPosition",
                args: [countryCode, amount],
            });

            return tx;
        } catch (error) {
            console.error("Long Error:", error);
            throw error;
        }
    };

    return {
        openLong: handleOpenLong,
        openShort: handleOpenShort,
    };
}