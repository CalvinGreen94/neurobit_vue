'use client';
import React, { useState } from "react";
import { abi } from '../abi/abi';
import { useToast } from "@chakra-ui/react"; // Import useToast for displaying notifications
import { useAccount, useConnect, useWriteContract } from 'wagmi';
import { useWaitForTransactionReceipt } from 'wagmi';

export default function PurchaseForm() {
    const [amount, setAmount] = useState(""); // State to track the input amount
    const account = useAccount();
    const toast = useToast(); // Get the toast function from Chakra UI

    const {
        data: hash,
        isPending,
        writeContract
    } = useWriteContract();

    const { error } = useConnect();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault(); // Prevent the default form submission behavior

        try {
            // Call the writeContract function with the purchaseTokens method and input amount
            console.log("Amount:", amount); // Check the amount before calling the contract
            await writeContract({
                address: '0x7f29314cE024bd807f5eF4F2A8Ca575d6BDEEE86',
                abi,
                functionName: 'purchaseTokens',
                args: [amount],
            });
        } catch (err) {
            console.error("Error occurred during transaction:", err);
            // Display error toast
            toast({
                title: "Transaction Error",
                description: err.message || "An error occurred while processing your transaction.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <>
            {account.status === 'connected' && (
                <form onSubmit={submit}>
                    <input 
                        name="amount" 
                        placeholder="5000" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} // Update the amount state
                        required 
                    />
                    <button
                        className="register-button4" 
                        disabled={isPending}
                        type="submit"
                    >
                        {isPending ? 'Confirming...' : 'Exchange'}
                    </button>
                    {hash && <div>Transaction Hash: {hash}</div>}
                    {isConfirming && <div>Waiting for confirmation...</div>}
                    {isConfirmed && <div>Transaction confirmed.</div>}
                    {/* {error && (
                        <div>Error: {(error as BaseError).shortMessage || error.message}</div>
                    )} */}
                </form>
            )}
        </>
    );
}
