// Wallet Connection and Management - Monad Testnet Support
class WalletManager {
    constructor() {
        this.walletAddress = null;
        this.walletBalance = 0;
        this.isConnected = false;
        this.monadChainId = ''0x279f';
        this.provider = null;
        this.accounts = [];
        this.currentAccountIndex = 0;
        this.init();
    }

    init() {
        this.detectProvider();
        this.bindEvents();
        this.checkPreviousConnection();
    }

    detectProvider() {
        if (typeof window.ethereum !== 'undefined') {
            this.provider = window.ethereum;
            console.log('✅ Ethereum provider detected');
        } else {
            console.log('🔶 No Ethereum provider found');
        }
    }

    bindEvents() {
        document.getElementById('connectWallet').addEventListener('click', () => {
            this.connectWallet();
        });

        document.getElementById('switchWallet').addEventListener('click', () => {
            this.showWalletSelector();
        });

        this.addDisconnectListener();
    }

    addDisconnectListener() {
        const walletInfo = document.getElementById('walletInfo');
        if (walletInfo) {
            walletInfo.addEventListener('click', (e) => {
                if (e.target.classList.contains('disconnect-btn')) {
                    this.disconnectWallet();
                }
            });
        }
    }

    async connectWallet() {
        try {
            // Check if Ethereum provider is available
            if (this.provider) {
                await this.handleRealWalletConnection();
            } else {
                // If no wallet found, suggest installations
                this.showWalletSuggestions();
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showError('Failed to connect wallet: ' + error.message);
        }
    }

    async handleRealWalletConnection() {
        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length > 0) {
            this.walletAddress = accounts[0];
            this.isConnected = true;

            // Check if we're on Monad Testnet, if not, switch
            await this.switchToMonadTestnet();

            // Update UI
            this.updateWalletUI();

            // Get balance
            await this.getRealBalance();

            // Save to localStorage
            this.saveWalletData();

            // Mark task as completed
            this.completeConnectionTask();

            // Initialize Monad integration
            this.initializeMonadIntegration();

            this.showSuccess('🎉 Wallet connected successfully to Monad Testnet!');
            console.log('✅ Wallet connected:', this.walletAddress);
        }
    }

    async switchToMonadTestnet() {
        const currentChainId = await window.ethereum.request({
            method: 'eth_chainId'
        });

        if (currentChainId !== this.monadChainId) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: this.monadChainId }],
                });
                console.log('✅ Switched to Monad Testnet');
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask
                if (switchError.code === 4902) {
                    try {
                        await this.addMonadTestnetToWallet();
                    } catch (addError) {
                        console.error('Error adding Monad Testnet:', addError);
                        this.showError('Please add Monad Testnet to your wallet manually. Check the console for details.');
                        throw addError;
                    }
                } else {
                    console.error('Error switching to Monad Testnet:', switchError);
                    this.showError('Failed to switch to Monad Testnet: ' + switchError.message);
                    throw switchError;
                }
            }
        }
    }

    async addMonadTestnetToWallet() {
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
                blockExplorerUrls: ['https://testnet-explorer.monad.xyz'],
                iconUrls: ['https://monad.xyz/icon.png'] // Optional
            }],
        });
        console.log('✅ Monad Testnet added to wallet');
    }

    async getRealBalance() {
        try {
            if (this.walletAddress && this.provider) {
                // Get native balance
                const balance = await window.ethereum.request({
                    method: 'eth_getBalance',
                    params: [this.walletAddress, 'latest']
                });

                // Convert from wei to MONAD
                this.walletBalance = parseInt(balance) / 1e18;

                // Update UI
                this.updateBalanceDisplay();

                // Save to localStorage
                localStorage.setItem('walletBalance', this.walletBalance.toFixed(6));

                console.log('💰 Balance:', this.walletBalance, 'MONAD');
            }
        } catch (error) {
            console.error('Error getting wallet balance:', error);
            // Fallback to mock balance
            this.useMockBalance();
        }
    }

    updateBalanceDisplay() {
        const balanceElement = document.getElementById('walletBalance');
        if (balanceElement) {
            if (this.walletBalance < 0.001) {
                balanceElement.textContent = '< 0.001 MONAD';
            } else {
                balanceElement.textContent = `${this.walletBalance.toFixed(4)} MONAD`;
            }
        }
    }

    useMockBalance() {
        this.walletBalance = (Math.random() * 10).toFixed(4);
        const balanceElement = document.getElementById('walletBalance');
        if (balanceElement) {
            balanceElement.textContent = `${this.walletBalance} MONAD (Demo)`;
        }
        console.log('🔶 Using mock balance for demonstration');
    }
    updateWalletUI() {
        const connectBtn = document.getElementById('connectWallet');
        const switchBtn = document.getElementById('switchWallet');
        const walletInfo = document.getElementById('walletInfo');
        const walletAddress = document.getElementById('walletAddress');

        if (connectBtn) connectBtn.classList.add('hidden');
        if (switchBtn) switchBtn.classList.remove('hidden'); // ← جديد
        if (walletInfo) walletInfo.classList.remove('hidden');

        const formattedAddress = this.formatAddress(this.walletAddress);
        if (walletAddress) walletAddress.textContent = formattedAddress;

        this.addDisconnectButton();
    }



    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    addDisconnectButton() {
        const walletInfo = document.getElementById('walletInfo');
        if (walletInfo && !walletInfo.querySelector('.disconnect-btn')) {
            const disconnectBtn = document.createElement('button');
            disconnectBtn.className = 'disconnect-btn';
            disconnectBtn.innerHTML = '🚪';
            disconnectBtn.title = 'Disconnect Wallet';
            disconnectBtn.style.cssText = `
                background: none;
                border: none;
                color: #ff6b6b;
                cursor: pointer;
                font-size: 1.2rem;
                margin-left: 10px;
                padding: 5px;
                border-radius: 4px;
                transition: all 0.3s ease;
            `;

            disconnectBtn.addEventListener('mouseenter', () => {
                disconnectBtn.style.background = 'rgba(255, 107, 107, 0.1)';
            });

            disconnectBtn.addEventListener('mouseleave', () => {
                disconnectBtn.style.background = 'none';
            });

            walletInfo.appendChild(disconnectBtn);
        }
    }

    showWalletSuggestions() {
        const modal = this.createWalletModal();
        document.body.appendChild(modal);

        // Add event listeners
        this.setupWalletModalListeners(modal);
    }

    createWalletModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); display: flex; justify-content: center;
            align-items: center; z-index: 10000; backdrop-filter: blur(10px);
        `;

        modal.innerHTML = `
            <div style="background: #1A1A2E; padding: 2rem; border-radius: 16px; text-align: center; max-width: 500px; width: 90%; border: 2px solid #6C63FF;">
                <h3 style="color: #6C63FF; margin-bottom: 1rem; font-family: 'Orbitron', sans-serif;">🔗 Wallet Required</h3>
                <p style="margin-bottom: 1.5rem; color: #8A8AA3; line-height: 1.6;">
                    To experience the full power of Omnichain Nexus with Monad Testnet, you need a Web3 wallet.
                </p>

                <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
                    <a href="https://metamask.io/download.html" target="_blank"
                       style="background: linear-gradient(135deg, #6C63FF, #FF6B6B); color: white; padding: 1rem; border-radius: 8px;
                              text-decoration: none; font-weight: 600; transition: transform 0.3s ease;">
                       📲 Install MetaMask
                    </a>

                    <a href="https://rabby.io/" target="_blank"
                       style="background: rgba(108, 99, 255, 0.1); color: #6C63FF; padding: 1rem; border-radius: 8px;
                              text-decoration: none; font-weight: 600; border: 1px solid #6C63FF; transition: all 0.3s ease;">
                       🦊 Try Rabby Wallet
                    </a>

                    <button id="demoModeBtn"
                            style="background: transparent; border: 1px solid #8A8AA3; color: #8A8AA3; padding: 1rem;
                                   border-radius: 8px; cursor: pointer; transition: all 0.3s ease;">
                            🎭 Continue in Demo Mode
                    </button>
                </div>

                <div style="background: rgba(108, 99, 255, 0.05); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                    <p style="font-size: 0.8rem; color: #8A8AA3; margin: 0;">
                        💡 <strong>Tip:</strong> After installing a wallet, refresh this page and click "Connect Wallet"
                    </p>
                </div>
            </div>
        `;

        return modal;
    }

    setupWalletModalListeners(modal) {
        // Demo mode button
        const demoBtn = modal.querySelector('#demoModeBtn');
        demoBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            this.mockWalletConnection();
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Add hover effects
        const links = modal.querySelectorAll('a, button');
        links.forEach(link => {
            link.addEventListener('mouseenter', () => {
                link.style.transform = 'translateY(-2px)';
            });
            link.addEventListener('mouseleave', () => {
                link.style.transform = 'translateY(0)';
            });
        });
    }

    checkPreviousConnection() {
        const savedWallet = localStorage.getItem('connectedWallet');
        const savedBalance = localStorage.getItem('walletBalance');

        if (savedWallet) {
            this.walletAddress = savedWallet;
            this.isConnected = true;

            this.updateWalletUI();

            if (savedBalance) {
                this.walletBalance = parseFloat(savedBalance);
                this.updateBalanceDisplay();
            }

            this.completeConnectionTask();

            console.log('✅ Reconnected to previous wallet:', this.formatAddress(savedWallet));
        }
    }

    saveWalletData() {
        localStorage.setItem('connectedWallet', this.walletAddress);
        localStorage.setItem('walletBalance', this.walletBalance.toFixed(6));
        localStorage.setItem('lastConnection', new Date().toISOString());
    }

    completeConnectionTask() {
        const task1 = document.getElementById('task1');
        if (task1) {
            task1.checked = true;
            if (typeof updateAirdropProgress === 'function') {
                updateAirdropProgress();
            }
        }
    }

    initializeMonadIntegration() {
        if (typeof monadIntegration !== 'undefined') {
            monadIntegration.initWithWallet(this.walletAddress);
        }
    }

    mockWalletConnection() {
        // Generate a mock Ethereum address for demo
        const mockAddress = '0x' + Array.from({ length: 40 }, () =>
            Math.floor(Math.random() * 16).toString(16)).join('');

        this.walletAddress = mockAddress;
        this.isConnected = true;

        // Update UI
        this.updateWalletUI();

        // Set a mock balance
        this.useMockBalance();

        // Save to localStorage
        this.saveWalletData();

        // Mark task as completed
        this.completeConnectionTask();

        // Initialize Monad integration in demo mode
        this.initializeMonadIntegration();

        // Show success message
        this.showSuccess('🔶 Connected in Demo Mode - Using mock data');

        console.log('🔶 Mock wallet connected:', this.walletAddress);
    }

    disconnectWallet() {
        this.walletAddress = null;
        this.walletBalance = 0;
        this.isConnected = false;
        this.accounts = [];
        this.currentAccountIndex = 0;

        const connectBtn = document.getElementById('connectWallet');
        const switchBtn = document.getElementById('switchWallet'); // ← جديد
        const walletInfo = document.getElementById('walletInfo');

        if (connectBtn) connectBtn.classList.remove('hidden');
        if (switchBtn) switchBtn.classList.add('hidden'); // ← جديد
        if (walletInfo) walletInfo.classList.add('hidden');

        localStorage.removeItem('connectedWallet');
        localStorage.removeItem('walletBalance');
        localStorage.removeItem('lastConnection');

        const task1 = document.getElementById('task1');
        if (task1) task1.checked = false;

        if (typeof updateAirdropProgress === 'function') {
            updateAirdropProgress();
        }

        this.showSuccess('Wallet disconnected successfully');
        console.log('✅ Wallet disconnected');
    }


    // Notification system
    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 350px;
            animation: slideInRight 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(56, 142, 60, 0.9))';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, rgba(244, 67, 54, 0.9), rgba(183, 28, 28, 0.9))';
        } else {
            notification.style.background = 'linear-gradient(135deg, rgba(108, 99, 255, 0.9), rgba(74, 68, 198, 0.9))';
        }

        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close" style="
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.3s ease;
            ">&times;</button>
        `;

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .notification-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        const autoRemove = setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        });

        // Remove on click anywhere
        notification.addEventListener('click', (e) => {
            if (e.target === notification) {
                clearTimeout(autoRemove);
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }
        });
    }

    // Utility method to get current wallet state
    getWalletState() {
        return {
            address: this.walletAddress,
            balance: this.walletBalance,
            isConnected: this.isConnected,
            provider: this.provider ? 'Web3 Wallet' : 'Demo Mode'
        };
    }

    // Method to sign messages (for future use)
    async signMessage(message) {
        if (!this.provider || !this.isConnected) {
            throw new Error('Wallet not connected');
        }

        try {
            const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [message, this.walletAddress],
            });
            return signature;
        } catch (error) {
            console.error('Error signing message:', error);
            throw error;
        }
    }
    showWalletSelector() {
        const modal = document.createElement('div');
        modal.className = 'wallet-selector';
        modal.style.display = 'flex';

        modal.innerHTML = `
          <div class="wallet-selector-content">
              <h3 style="color: #6C63FF; margin-bottom: 1rem;">🔗 Select Wallet</h3>
              <p style="color: #8A8AA3; margin-bottom: 1.5rem;">Choose which wallet to use for this session</p>

              <div id="walletOptions">
              </div>

              <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                  <button id="addNewAccount" style="flex: 1; padding: 0.8rem; background: #6C63FF; color: white; border: none; border-radius: 8px; cursor: pointer;">
                      ➕ Add New Account
                  </button>
                  <button id="closeSelector" style="flex: 1; padding: 0.8rem; background: transparent; border: 1px solid #6C63FF; color: #6C63FF; border-radius: 8px; cursor: pointer;">
                      ❌ Cancel
                  </button>
              </div>
          </div>
      `;

        document.body.appendChild(modal);
        this.populateWalletOptions(modal);
        this.setupWalletSelectorListeners(modal);
    }
    populateWalletOptions(modal) {
        const optionsContainer = modal.querySelector('#walletOptions');

        if (this.accounts.length === 0) {
            optionsContainer.innerHTML = `
              <div class="wallet-option">
                  <div class="wallet-type">Current Account</div>
                  <div class="wallet-address">${this.formatAddress(this.walletAddress)}</div>
                  <span class="account-badge">Active</span>
              </div>
          `;
            return;
        }

        let optionsHTML = '';
        this.accounts.forEach((account, index) => {
            const isActive = index === this.currentAccountIndex;
            optionsHTML += `
              <div class="wallet-option" data-index="${index}">
                  <div class="wallet-type">Account ${index + 1}</div>
                  <div class="wallet-address">${this.formatAddress(account)}</div>
                  ${isActive ? '<span class="account-badge">Active</span>' : ''}
              </div>
          `;
        });

        optionsContainer.innerHTML = optionsHTML;
    }
    setupWalletSelectorListeners(modal) {
        modal.querySelectorAll('.wallet-option').forEach(option => {
            option.addEventListener('click', () => {
                const index = parseInt(option.getAttribute('data-index'));
                this.switchAccount(index);
                document.body.removeChild(modal);
            });
        });
        modal.querySelector('#addNewAccount').addEventListener('click', () => {
            this.addNewAccount();
            document.body.removeChild(modal);
        });

        modal.querySelector('#closeSelector').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }


    async switchAccount(index) {
        if (this.accounts[index]) {
            this.currentAccountIndex = index;
            this.walletAddress = this.accounts[index];
            this.updateWalletUI();
            await this.getRealBalance();

            if (typeof monadIntegration !== 'undefined') {
                monadIntegration.initWithWallet(this.walletAddress);
            }

            this.showSuccess(`Switched to account ${index + 1}`);
        }
    }

    async addNewAccount() {
        try {
            await window.ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }]
            });

            await this.loadAccounts();
            this.showSuccess('New account added successfully');

        } catch (error) {
            console.error('Error adding new account:', error);
            this.showError('Failed to add new account');
        }
    }

    async loadAccounts() {
        if (this.provider) {
            try {
                this.accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });

                if (this.accounts.length > 0 && !this.walletAddress) {
                    this.walletAddress = this.accounts[0];
                    this.currentAccountIndex = 0;
                }
            } catch (error) {
                console.error('Error loading accounts:', error);
            }
        }
    }

}

// Initialize Wallet Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.walletManager = new WalletManager();

    // Expose wallet manager globally for debugging
    if (typeof window !== 'undefined') {
        window.getWalletState = () => walletManager.getWalletState();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletManager;
}

class MultiWalletManager {
    constructor() {
        this.accounts = [];
        this.currentAccount = null;
        this.walletType = 'primary'; // primary, secondary, hardware
    }

    async switchAccount(accountIndex) {
        if (this.accounts.length > accountIndex) {
            this.currentAccount = this.accounts[accountIndex];
            await this.updateWalletUI();
            return true;
        }
        return false;
    }

    async getAccounts() {
        if (this.provider) {
            this.accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            return this.accounts;
        }
        return [];
    }
}

walletManager.getAccounts = async function() {
    if (this.provider) {
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        this.accounts = accounts;
        return accounts;
    }
    return [];
};
