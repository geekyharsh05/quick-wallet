import { Detail } from "@raycast/api";
import { useSolanaBalance } from "./helpers";

const WALLET_TO_CHECK = "HgTShbbp6F2QqUE7wHLLQWaknmpCvsyUCDRdkRJVoM7P";

export default function Command() {
  const { balance, isLoading, error } = useSolanaBalance(WALLET_TO_CHECK);

  let markdownContent = "";
  if (isLoading) {
    markdownContent = "# Fetching Balance...";
  } else if (error) {
    markdownContent = `# Error\n\nFailed to fetch balance: ${error}`;
  } else if (balance !== null) {
    markdownContent = `# Solana Balance\n\n**Address:** ${WALLET_TO_CHECK}\n\n**Balance:** ${balance.toFixed(4)} SOL`;
  } else {
    markdownContent = "# No balance data";
  }

  return <Detail markdown={markdownContent} />;
} 