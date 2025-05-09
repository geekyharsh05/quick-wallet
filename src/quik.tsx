import { List, Detail, ActionPanel, Action, Icon, Form, showToast, Toast, Clipboard, useNavigation } from "@raycast/api";
import { useSolanaBalance, useSplTokenBalances } from "./helpers";
import { useState } from "react";

const WALLET_TO_CHECK = "HgTShbbp6F2QqUE7wHLLQWaknmpCvsyUCDRdkRJVoM7P";

function formatTokenBalance(balance: number, decimals: number): string {
  return balance.toFixed(Math.min(decimals, 6));
}

interface SendFormProps {
  tokenSymbol: string;
  tokenDecimals: number;
  mintAddress?: string;
  senderAddress: string;
}

function SendForm({ tokenSymbol, mintAddress, senderAddress, tokenDecimals }: SendFormProps) {
  const navigation = useNavigation();
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [errors, setErrors] = useState<{ recipient?: string; amount?: string }>({});

  function validateField(fieldName: "recipient" | "amount"): boolean {
    let isValid = true;
    const newErrors = { ...errors };

    if (fieldName === "recipient") {
      if (!recipientAddress) {
        newErrors.recipient = "Recipient address is required.";
        isValid = false;
      } else if (recipientAddress.length < 32 || recipientAddress.length > 44) {
        newErrors.recipient = "Invalid address length (must be 32-44 chars).";
        isValid = false;
      } else if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(recipientAddress)) {
        newErrors.recipient = "Address contains invalid Base58 characters.";
        isValid = false;
      } else {
        delete newErrors.recipient;
      }
    }

    if (fieldName === "amount") {
      if (!amount) {
        newErrors.amount = "Amount is required.";
        isValid = false;
      } else {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
          newErrors.amount = "Amount must be a positive number.";
          isValid = false;
        } else {
          const parts = amount.split('.');
          if (parts.length > 1 && parts[1].length > tokenDecimals) {
            newErrors.amount = `Amount cannot have more than ${tokenDecimals} decimal places for ${tokenSymbol}.`;
            isValid = false;
          } else {
            delete newErrors.amount;
          }
        }
      }
    }
    setErrors(newErrors);
    return isValid;
  }

  function validateAllFields(): boolean {
    const recipientValid = validateField("recipient");
    const amountValid = validateField("amount");
    return recipientValid && amountValid;
  }

  async function handleSubmit() {
    if (!validateAllFields()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Validation Error",
        message: "Please check the form for errors.",
      });
      return;
    }

    let command: string;
    const numericAmount = parseFloat(amount);

    if (mintAddress) {
      command = `spl-token transfer ${mintAddress} ${numericAmount} ${recipientAddress} --owner ${senderAddress} --allow-unfunded-recipient`;
    } else {
      command = `solana transfer ${recipientAddress} ${numericAmount} --from ${senderAddress}`;
    }

    await Clipboard.copy(command);
    await showToast({
      style: Toast.Style.Success,
      title: "Command Copied!",
      message: `CLI command to send ${amount} ${tokenSymbol} copied to clipboard.`,
    });
    navigation.pop();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title={`Copy Send ${tokenSymbol} Command`} onSubmit={handleSubmit} icon={Icon.Terminal} />
        </ActionPanel>
      }
    >
      <Form.Description text={`Prepare a CLI command to send ${tokenSymbol}. Paste it into your terminal.`} />
      <Form.TextField
        id="recipientAddress"
        title="Recipient Address"
        placeholder="Enter recipient's Solana address"
        value={recipientAddress}
        error={errors.recipient}
        onChange={setRecipientAddress}
        onBlur={() => validateField("recipient")}
      />
      <Form.TextField
        id="amount"
        title={`Amount (${tokenSymbol})`}
        placeholder={`Enter amount of ${tokenSymbol} to send`}
        value={amount}
        error={errors.amount}
        onChange={setAmount}
        onBlur={() => validateField("amount")}
      />
      <Form.Separator />
      <Form.Description text={`Sender (from your wallet): ${senderAddress}`} />
      {mintAddress && <Form.Description text={`Token: ${tokenSymbol} (Mint: ${mintAddress})`} />}
      <Form.Description text={"Note: Ensure your Solana CLI is configured with the sender's keypair."} />
    </Form>
  );
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
                <Action.Push
                  title="Send Sol"
                  icon={Icon.Upload}
                  target={
                    <SendForm
                      tokenSymbol="SOL"
                      senderAddress={WALLET_TO_CHECK}
                      tokenDecimals={9} // SOL has 9 decimals
                    />
                  }
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
                <Action.Push
                  title={`Send ${token.symbol}`}
                  icon={Icon.Upload}
                  target={
                    <SendForm
                      tokenSymbol={token.symbol}
                      mintAddress={token.mintAddress}
                      senderAddress={WALLET_TO_CHECK}
                      tokenDecimals={token.decimals}
                    />
                  }
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