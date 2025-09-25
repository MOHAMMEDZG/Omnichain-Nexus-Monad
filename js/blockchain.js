// Blockchain Interaction Utilities - Monad Testnet Support
class BlockchainInterface {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.monadChainId = '0x1f4'; // 500 in decimal - Monad Testnet
        this.supportedChains = {
            '0x1': { name: 'Ethereum Mainnet', supported: false },
            '0xaa36a7': { name: 'Sepolia Testnet', supported: false },
            '0x1f4': { name: 'Monad Testnet', supported: true }, // Monad Testnet
            '0x89': { name: 'Polygon Mainnet', supported: false },
            '0x13881': { name: 'Mumbai Testnet', supported: false }
        };
        this.init();
    }

    init() {
        this.detectProvider();
        this.setupEventListeners();
    }

    detectProvider() {
        if (typeof window.ethereum !== 'undefined') {
            this.provider = window.ethereum;
            console.log('✅ Ethereum provider detected');
            this.updateNetworkStatus();
        } else {
            console.log('⚠️ No Ethereum provider found, using mock mode');
            this.setMockMode();
        }
    }

    setupEventListeners() {
        if (this.provider) {
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('Accounts changed:', accounts);
                if (accounts.length === 0) {
                    // User disconnected their wallet
                    if (typeof walletManager !== 'undefined') {
                        walletManager.disconnectWallet();
                    }
                } else {
                    // Account changed
                    if (typeof walletManager !== 'undefined') {
                        walletManager.walletAddress = accounts[0];
                        walletManager.updateWalletUI();
                        walletManager.getRealBalance();
                    }
                }
            });

            // Listen for chain changes
            window.ethereum.on('chainChanged', (chainId) => {
                console.log('Chain changed to:', chainId);
                this.updateNetworkStatus();

                if (chainId === this.monadChainId) {
                    this.showNetworkNotification('Connected to Monad Testnet!', 'success');
                    if (typeof walletManager !== 'undefined' && walletManager.isConnected) {
                        walletManager.getRealBalance();
                    }
                } else {
                    this.showNetworkNotification('Please switch to Monad Testnet for full functionality', 'warning');
                }
            });

            // Listen for connection events
            window.ethereum.on('connect', (connectInfo) => {
                console.log('Connected to chain:', connectInfo.chainId);
                this.updateNetworkStatus();
            });

            window.ethereum.on('disconnect', (error) => {
                console.log('Disconnected from chain:', error);
                this.updateNetworkStatus();
            });
        }
    }

    async updateNetworkStatus() {
        if (!this.provider) return;

        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const networkStatus = document.getElementById('networkStatus');
            const networkName = document.getElementById('networkName');
            const networkDot = document.querySelector('.network-dot');

            if (networkStatus && networkName && networkDot) {
                const chainInfo = this.supportedChains[chainId] || { name: 'Unknown Network', supported: false };

                networkStatus.classList.remove('hidden');
                networkName.textContent = chainInfo.name;

                if (chainId === this.monadChainId) {
                    networkStatus.classList.add('connected');
                    networkStatus.classList.remove('disconnected');
                    networkDot.style.background = '#4CAF50';
                } else {
                    networkStatus.classList.add('disconnected');
                    networkStatus.classList.remove('connected');
                    networkDot.style.background = '#FF6B6B';
                }
            }
        } catch (error) {
            console.error('Error updating network status:', error);
        }
    }

    setMockMode() {
        // Set up mock mode for demonstration
        console.log('🔶 Running in mock mode - no real blockchain connection');
        const networkStatus = document.getElementById('networkStatus');
        if (networkStatus) {
            networkStatus.classList.remove('hidden');
            networkStatus.classList.add('disconnected');
            document.getElementById('networkName').textContent = 'Mock Mode';
            document.querySelector('.network-dot').style.background = '#FF6B6B';
        }
    }

    async getNetworkInfo() {
        if (this.provider) {
            try {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                const networkId = await window.ethereum.request({ method: 'net_version' });

                return {
                    chainId: chainId,
                    networkId: parseInt(networkId),
                    chainName: this.supportedChains[chainId] ?.name || 'Unknown Network',
                    isMonadTestnet: chainId === this.monadChainId
                };
            } catch (error) {
                console.error('Error getting network info:', error);
                return null;
            }
        }

        return {
            chainId: this.monadChainId,
            networkId: 500,
            chainName: 'Monad Testnet (Mock)',
            isMonadTestnet: true
        };
    }

    async switchToMonadTestnet() {
        if (!this.provider) {
            this.showNetworkNotification('Please install a Web3 wallet like MetaMask', 'error');
            return false;
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.monadChainId }],
            });
            return true;
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: this.monadChainId,
                            chainName: 'Monad Testnet',
                            nativeCurrency: {
                                name: 'MONAD',
                                symbol: 'MONAD',
                                decimals: 18
                            },
                            rpcUrls: ['https://testnet-rpc.monad.xyz'],
                            blockExplorerUrls: ['https://testnet-explorer.monad.xyz']
                        }],
                    });
                    return true;
                } catch (addError) {
                    console.error('Error adding Monad Testnet:', addError);
                    this.showNetworkNotification('Failed to add Monad Testnet to your wallet', 'error');
                    return false;
                }
            } else {
                console.error('Error switching to Monad Testnet:', switchError);
                this.showNetworkNotification('Failed to switch to Monad Testnet', 'error');
                return false;
            }
        }
    }

    async addTokenToWallet(tokenAddress, tokenSymbol, tokenDecimals = 18) {
        if (!this.provider) {
            this.showNotification('Please connect a wallet to add tokens', 'error');
            return false;
        }

        try {
            const wasAdded = await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: tokenAddress,
                        symbol: tokenSymbol,
                        decimals: tokenDecimals,
                        image: 'https://your-token-image-url.png', // Optional
                    },
                },
            });

            if (wasAdded) {
                this.showNotification(`${tokenSymbol} token added to your wallet!`, 'success');
                return true;
            } else {
                this.showNotification('Token was not added', 'warning');
                return false;
            }
        } catch (error) {
            console.error('Error adding token to wallet:', error);
            this.showNotification('Failed to add token to wallet', 'error');
            return false;
        }
    }

    async sendTransaction(transaction) {
        if (!this.provider) {
            return this.mockTransaction(transaction);
        }

        try {
            // Validate transaction
            if (!transaction.from) {
                transaction.from = await this.getCurrentAccount();
            }

            if (!transaction.gas) {
                transaction.gas = await this.estimateGas(transaction);
            }

            if (!transaction.gasPrice) {
                transaction.gasPrice = await this.getGasPrice();
            }

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transaction],
            });

            this.showNotification('Transaction sent! Waiting for confirmation...', 'success');

            // Wait for confirmation
            const receipt = await this.waitForTransactionReceipt(txHash);

            if (receipt && receipt.status === '0x1') {
                this.showNotification('Transaction confirmed!', 'success');
                return receipt;
            } else {
                this.showNotification('Transaction failed', 'error');
                return null;
            }
        } catch (error) {
            console.error('Error sending transaction:', error);
            this.showNotification('Transaction failed: ' + error.message, 'error');
            return null;
        }
    }

    async sendRealTransaction(transaction) {
        return this.sendTransaction(transaction);
    }

    async getCurrentAccount() {
        if (!this.provider) return null;

        try {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });
            return accounts[0] || null;
        } catch (error) {
            console.error('Error getting current account:', error);
            return null;
        }
    }

    async estimateGas(transaction) {
        if (!this.provider) return '0x5208'; // 21000 gas in hex

        try {
            const gasEstimate = await window.ethereum.request({
                method: 'eth_estimateGas',
                params: [transaction],
            });
            return gasEstimate;
        } catch (error) {
            console.error('Error estimating gas:', error);
            return '0x5208'; // Fallback to 21000 gas
        }
    }

    async getGasPrice() {
        if (!this.provider) return '0x' + (20e9).toString(16); // 20 Gwei in hex

        try {
            const gasPrice = await window.ethereum.request({
                method: 'eth_gasPrice',
                params: [],
            });
            return gasPrice;
        } catch (error) {
            console.error('Error getting gas price:', error);
            return '0x' + (20e9).toString(16); // Fallback to 20 Gwei
        }
    }

    async waitForTransactionReceipt(txHash, maxAttempts = 30) {
        if (!this.provider) {
            return this.mockTransactionReceipt(txHash);
        }

        for (let i = 0; i < maxAttempts; i++) {
            try {
                const receipt = await window.ethereum.request({
                    method: 'eth_getTransactionReceipt',
                    params: [txHash],
                });

                if (receipt) {
                    return receipt;
                }
            } catch (error) {
                console.error('Error getting receipt:', error);
            }

            // Wait 2 seconds before next attempt
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Show progress every 10 seconds
            if (i % 5 === 0) {
                this.showNotification(`Waiting for confirmation... (${i * 2}s)`, 'info');
            }
        }

        throw new Error('Transaction confirmation timeout after 60 seconds');
    }

    async getTransactionReceipt(txHash) {
        if (!this.provider) {
            return this.mockTransactionReceipt(txHash);
        }

        try {
            const receipt = await window.ethereum.request({
                method: 'eth_getTransactionReceipt',
                params: [txHash],
            });
            return receipt;
        } catch (error) {
            console.error('Error getting transaction receipt:', error);
            return null;
        }
    }

    // Mock methods for demo mode
    async mockTransaction(transaction) {
        this.showNotification('Mock transaction sent (Demo Mode)', 'info');

        return new Promise((resolve) => {
            setTimeout(() => {
                // Generate mock transaction hash
                const mockHash = '0x' + Array.from({ length: 64 }, () =>
                    Math.floor(Math.random() * 16).toString(16)).join('');

                const mockReceipt = {
                    transactionHash: mockHash,
                    blockNumber: '0x' + Math.floor(Math.random() * 1000000).toString(16),
                    status: '0x1', // Success
                    gasUsed: '0x' + Math.floor(21000 + Math.random() * 50000).toString(16),
                    from: transaction.from || '0x0000000000000000000000000000000000000000',
                    to: transaction.to || '0x0000000000000000000000000000000000000000'
                };

                resolve(mockReceipt);
            }, 3000);
        });
    }

    async mockTransactionReceipt(txHash) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    transactionHash: txHash,
                    blockNumber: '0x' + Math.floor(Math.random() * 1000000).toString(16),
                    status: '0x1', // Success
                    gasUsed: '0x' + Math.floor(21000 + Math.random() * 50000).toString(16)
                });
            }, 1000);
        });
    }

    // Utility methods
    toWei(amount, decimals = 18) {
        const wei = BigInt(Math.floor(amount * 10 ** decimals)).toString(16);
        return '0x' + wei;
    }

    fromWei(weiAmount, decimals = 18) {
        return parseInt(weiAmount) / 10 ** decimals;
    }

    // Notification system
    showNotification(message, type) {
        if (typeof walletManager !== 'undefined') {
            if (type === 'success') {
                walletManager.showSuccess(message);
            } else if (type === 'error') {
                walletManager.showError(message);
            } else {
                walletManager.showNotification(message, type);
            }
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    showNetworkNotification(message, type) {
        this.showNotification(message, type);
    }
}

// Transaction Builder for Cross-Chain Operations
class TransactionBuilder {
    constructor() {
        this.chains = {
            ethereum: { id: 1, name: 'Ethereum', testnet: false },
            sepolia: { id: 11155111, name: 'Sepolia Testnet', testnet: true },
            monad: { id: 500, name: 'Monad Testnet', testnet: true },
            polygon: { id: 137, name: 'Polygon', testnet: false },
            mumbai: { id: 80001, name: 'Mumbai Testnet', testnet: true },
            arbitrum: { id: 42161, name: 'Arbitrum', testnet: false }
        };
    }

    buildTransferTransaction(to, amount, chain = 'monad') {
        const chainInfo = this.chains[chain];

        return {
            to: to,
            value: this.toWei(amount),
            chainId: `0x${chainInfo.id.toString(16)}`,
            gas: '0x' + (21000).toString(16), // Basic transfer gas
            gasPrice: '0x' + (20e9).toString(16) // 20 Gwei
        };
    }

    buildContractTransaction(to, data, chain = 'monad') {
        const chainInfo = this.chains[chain];

        return {
            to: to,
            data: data,
            chainId: `0x${chainInfo.id.toString(16)}`,
            gas: '0x' + (100000).toString(16), // Estimated gas for contract calls
            gasPrice: '0x' + (20e9).toString(16) // 20 Gwei
        };
    }

    buildSmartAccountTransaction(to, value, data = '0x') {
        return {
            to: to,
            value: value,
            data: data,
            chainId: '0x1f4', // Monad Testnet
            gas: '0x' + (50000).toString(16), // Gas for smart account operations
            gasPrice: '0x' + (20e9).toString(16) // 20 Gwei
        };
    }

    toWei(amount, decimals = 18) {
        // Convert to wei
        const wei = BigInt(Math.floor(amount * 10 ** decimals)).toString(16);
        return '0x' + wei;
    }

    fromWei(weiAmount, decimals = 18) {
        // Convert from wei
        return parseInt(weiAmount) / 10 ** decimals;
    }

    encodeFunctionCall(functionSignature, parameters = []) {
        // Basic function encoding (in real app, use web3.js or ethers.js)
        let data = functionSignature;

        parameters.forEach(param => {
            if (typeof param === 'string' && param.startsWith('0x')) {
                data += param.replace('0x', '').padStart(64, '0');
            } else if (typeof param === 'number') {
                data += BigInt(param).toString(16).padStart(64, '0');
            } else {
                data += '0'.repeat(64); // Placeholder
            }
        });

        return data;
    }
}

// Initialize Blockchain Interface
const blockchain = new BlockchainInterface();
const transactionBuilder = new TransactionBuilder();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlockchainInterface, TransactionBuilder };
}