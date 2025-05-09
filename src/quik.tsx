import { List, Detail, ActionPanel, Action } from "@raycast/api";
import { useSolanaBalance, useSplTokenBalances } from "./helpers";

const WALLET_TO_CHECK = "HgTShbbp6F2QqUE7wHLLQWaknmpCvsyUCDRdkRJVoM7P";

function formatTokenBalance(balance: number, decimals: number): string {
  return balance.toFixed(Math.min(decimals, 6)); // Show up to 6 decimal places or token's decimals if less
}

export default function Command() {
  const { balance: solBalance, isLoading: isLoadingSol, error: errorSol } = useSolanaBalance(WALLET_TO_CHECK);
  const { tokenBalances, isLoading: isLoadingTokens, error: errorTokens } = useSplTokenBalances(WALLET_TO_CHECK);

  const isLoading = isLoadingSol || isLoadingTokens;
  const combinedError = errorSol || errorTokens;

  if (combinedError) {
    return (
      <Detail markdown={`# Error\n\nCould not fetch balances: ${combinedError}`}/>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search tokens...">
      <List.Section title="Native Balance">
        {solBalance !== null && (
          <List.Item
            title="SOL"
            subtitle="Solana"
            accessories={[{ text: `${formatTokenBalance(solBalance, 9)} SOL` }]}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard
                  title="Copy Balance"
                  content={solBalance.toString()}
                />
                <Action.CopyToClipboard
                  title="Copy Wallet Address"
                  content={WALLET_TO_CHECK}
                />
              </ActionPanel>
            }
          />
        )}
      </List.Section>
      <List.Section title="Token Balances">
        {tokenBalances.map((token) => (
          <List.Item
            key={token.mintAddress}
            title={token.symbol}
            subtitle={token.name}
            accessories={[{ text: `${formatTokenBalance(token.uiAmount, token.decimals)} ${token.symbol}` }]}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard
                  title={`Copy ${token.symbol} Balance`}
                  content={token.uiAmount.toString()}
                />
                <Action.CopyToClipboard
                  title="Copy Token Mint Address"
                  content={token.mintAddress}
                />
                 <Action.CopyToClipboard
                  title="Copy Wallet Address"
                  content={WALLET_TO_CHECK}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      {(!isLoading && solBalance === null && tokenBalances.length === 0 && !combinedError) && (
         <List.EmptyView title="No Balances Found" description={`No SOL or token balances found for ${WALLET_TO_CHECK}.`}/>
      )}
    </List>
  );
} 