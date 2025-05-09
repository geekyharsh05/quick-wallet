import { useState, useEffect } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface UseSolanaBalanceReturn {
  balance: number | null;
  isLoading: boolean;
  error: string | null;
}

export function useSolanaBalance(walletAddress: string): UseSolanaBalanceReturn {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setError("Wallet address is required.");
      setIsLoading(false);
      setBalance(null);
      return;
    }

    async function fetchBalance() {
      setIsLoading(true);
      setError(null);
      try {
        const connection = new Connection("https://api.mainnet-beta.solana.com");
        const publicKey = new PublicKey(walletAddress);

        const lamports = await connection.getBalance(publicKey);
        setBalance(lamports / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error(`Failed to fetch balance for ${walletAddress}:`, err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred while fetching balance.");
        }
        setBalance(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalance();
  }, [walletAddress]);

  return { balance, isLoading, error };
}
