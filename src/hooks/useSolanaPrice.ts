import { useQuery } from "@tanstack/react-query";
import { fetchSolanaPrice } from "../services/solana";
import { SolanaPriceData } from "../types";

export function useSolanaPrice() {
  const {
    data: priceData = { price: 0, priceChange24h: 0 },
    isLoading,
    error,
  } = useQuery<SolanaPriceData, Error>({
    queryKey: ["solanaPrice"],
    queryFn: fetchSolanaPrice,
    refetchInterval: 60000, // Refetch every 1 minute
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    gcTime: 300000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    price: priceData.price,
    priceChange24h: priceData.priceChange24h,
    isLoading,
    error: error ? error.message : null,
  };
}
