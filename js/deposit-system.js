// Deposit and Claim System for Monad Testnet
class DepositSystem {
    constructor() {
        this.userDeposits = [];
        this.totalDeposited = 0;
        this.totalEarnings = 0;
        this.claimedAmount = 0;
        this.dailyLimit = 10; // MONAD per day
        this.init();
    }

    init() {
        this.loadUserData();
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        // Deposit events
        document.getElementById('depositBtn').addEventListener('click', () => {
            this.handleDeposit();
        });

        document.getElementById('maxAmount').addEventListener('click', () => {
            this.setMaxAmount();
        });

        document.getElementById('depositAmount').addEventListener('input', (e) => {
            this.validateDepositAmount(e.target.value);
        });

        // Claim events
        document.getElementById('claimMonad').addEventListener('click', () => {
            this.handleClaimMonad();
        });

        document.getElementById('claimEarnings').addEventListener('click', () => {
            this.handleClaimEarnings();
        });

        // Amount options
        document.querySelectorAll('.amount-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectAmountOption(e.target);
            });
        });

        // Update balance when wallet connects
        if (typeof walletManager !== 'undefined') {
            walletManager.updateBalanceDisplay = () => {
                this.updateAvailableBalance();
            };
        }
    }

    async handleDeposit() {
        if (!this.validateWalletConnection()) return;

        const amount = parseFloat(document.getElementById('depositAmount').value);
        if (!this.validateDepositAmount(amount)) return;

        try {
            this.showNotification(`Depositing ${amount} MONAD...`, 'info');

            // Simulate deposit transaction
            const transaction = {
                from: walletManager.walletAddress,
                to: '0xDep0s1tC0ntr4ct0000000000000000000000', // Deposit contract
                value: blockchain.toWei(amount),
                data: '0xdeposit',
                gas: '0x' + (100000).toString(16)
            };

            const receipt = await blockchain.sendRealTransaction(transaction);

            if (receipt) {
                this.addDeposit(amount, receipt.transactionHash);
                this.showNotification(`✅ Successfully deposited ${amount} MONAD!`, 'success');
            }
        } catch (error) {
            console.error('Deposit error:', error);
            this.showNotification('❌ Deposit failed: ' + error.message, 'error');
        }
    }

    async handleClaimMonad() {
        if (!this.validateWalletConnection()) return;

        const amount = this.getSelectedAmount();
        if (!this.canClaim(amount)) return;

        try {
            this.showNotification(`Claiming ${amount} MONAD...`, 'info');

            // Simulate faucet claim
            const transaction = {
                from: walletManager.walletAddress,
                to: '0xF4uc3tC0ntr4ct00000000000000000000000', // Faucet contract
                value: '0x0',
                data: '0xclaim' + blockchain.toWei(amount).replace('0x', '').padStart(64, '0'),
                gas: '0x' + (50000).toString(16)
            };

            const receipt = await blockchain.sendRealTransaction(transaction);

            if (receipt) {
                this.recordClaim(amount, receipt.transactionHash);
                this.showNotification(`✅ Successfully claimed ${amount} MONAD!`, 'success');

                // Update wallet balance display
                if (typeof walletManager !== 'undefined') {
                    setTimeout(() => {
                        walletManager.getRealBalance();
                    }, 3000);
                }
            }
        } catch (error) {
            console.error('Claim error:', error);
            this.showNotification('❌ Claim failed: ' + error.message, 'error');
        }
    }

    async handleClaimEarnings() {
        if (!this.validateWalletConnection()) return;

        if (this.totalEarnings <= 0) {
            this.showNotification('No earnings to claim', 'warning');
            return;
        }

        try {
            this.showNotification(`Claiming ${this.totalEarnings} MONAD earnings...`, 'info');

            const transaction = {
                from: walletManager.walletAddress,
                to: '0xE4rn1ngsC0ntr4ct000000000000000000000',
                value: '0x0',
                data: '0xwithdraw',
                gas: '0x' + (100000).toString(16)
            };

            const receipt = await blockchain.sendRealTransaction(transaction);

            if (receipt) {
                this.claimedAmount += this.totalEarnings;
                this.totalEarnings = 0;
                this.updateUI();
                this.saveUserData();

                this.showNotification(`✅ Successfully claimed earnings!`, 'success');

                // Update wallet balance
                setTimeout(() => {
                    walletManager.getRealBalance();
                }, 3000);
            }
        } catch (error) {
            console.error('Earnings claim error:', error);
            this.showNotification('❌ Earnings claim failed', 'error');
        }
    }

    // Validation methods
    validateWalletConnection() {
        if (!walletManager || !walletManager.isConnected) {
            this.showNotification('Please connect your wallet first', 'error');
            return false;
        }
        return true;
    }

    validateDepositAmount(amount) {
        const btn = document.getElementById('depositBtn');
        const available = this.getAvailableBalance();

        if (!amount || amount <= 0) {
            btn.disabled = true;
            return false;
        }

        if (amount > available) {
            this.showNotification('Insufficient balance', 'error');
            btn.disabled = true;
            return false;
        }

        btn.disabled = false;
        return true;
    }

    canClaim(amount) {
        const today = new Date().toDateString();
        const todayClaims = this.claimedAmount; // Simplified - should track by date

        if (todayClaims + amount > this.dailyLimit) {
            this.showNotification(`Daily claim limit reached (${this.dailyLimit} MONAD)`, 'error');
            return false;
        }

        return true;
    }

    // UI methods
    setMaxAmount() {
        const available = this.getAvailableBalance();
        document.getElementById('depositAmount').value = available;
        this.validateDepositAmount(available);
    }

    selectAmountOption(option) {
        document.querySelectorAll('.amount-option').forEach(opt => {
            opt.classList.remove('active');
        });
        option.classList.add('active');
    }

    getSelectedAmount() {
        const activeOption = document.querySelector('.amount-option.active');
        return parseFloat(activeOption.getAttribute('data-amount'));
    }

    updateAvailableBalance() {
        const balance = this.getAvailableBalance();
        document.getElementById('availableBalance').textContent = balance.toFixed(4);
    }

    getAvailableBalance() {
        if (walletManager && walletManager.isConnected) {
            return walletManager.walletBalance || 0;
        }
        return 0;
    }

    // Data management
    addDeposit(amount, txHash) {
        const deposit = {
            amount: amount,
            timestamp: Date.now(),
            txHash: txHash,
            earnings: 0
        };

        this.userDeposits.push(deposit);
        this.totalDeposited += amount;
        // Calculate APY earnings (simplified)
        const dailyEarnings = amount * 0.125 / 365; // 12.5% APY
        deposit.earnings = dailyEarnings;
        this.totalEarnings += dailyEarnings;

        this.updateUI();
        this.saveUserData();
    }

    recordClaim(amount, txHash) {
        this.claimedAmount += amount;
        this.saveUserData();
    }

    updateUI() {
        this.updateAvailableBalance();

        // Update deposited amount - استخدم backticks ``
        const depositedElement = document.getElementById('totalDeposited');
        if (depositedElement) {
            depositedElement.textContent = '$ { this.totalDeposited.toFixed(2) }MONAD';
        }

        const earningsElement = document.getElementById('totalEarnings');
        if (earningsElement) {
            earningsElement.textContent = '$ { this.totalEarnings.toFixed(4) }MONAD';
        }
      }
        updateDepositList() {
            const list = document.getElementById('depositList');

            if (this.userDeposits.length === 0) {
                list.innerHTML = `
                <div class="empty-state">
                    <p>No deposits yet</p>
                    <small>Deposit MONAD to start earning rewards</small>
                </div>
            `;
                return;
            }

            list.innerHTML = this.userDeposits.map((deposit, index) => `
            <div class="deposit-item">
                <div class="deposit-header">
                    <span>Deposit #${index + 1}</span>
                    <span class="amount">${deposit.amount} MONAD</span>
                </div>
                <div class="deposit-details">
                    <small>Date: ${new Date(deposit.timestamp).toLocaleDateString()}</small>
                    <small>Earnings: ${deposit.earnings.toFixed(6)} MONAD</small>
                </div>
            </div>
        `).join('');
        }

        // Storage methods
        saveUserData() {
            const data = {
                deposits: this.userDeposits,
                totalDeposited: this.totalDeposited,
                totalEarnings: this.totalEarnings,
                claimedAmount: this.claimedAmount,
                lastUpdate: Date.now()
            };
            localStorage.setItem('monadDepositData', JSON.stringify(data));
        }

        loadUserData() {
            const saved = localStorage.getItem('monadDepositData');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    this.userDeposits = data.deposits || [];
                    this.totalDeposited = data.totalDeposited || 0;
                    this.totalEarnings = data.totalEarnings || 0;
                    this.claimedAmount = data.claimedAmount || 0;
                } catch (error) {
                    console.error('Error loading deposit data:', error);
                }
            }
        }

        // Notification system
        showNotification(message, type) {
            if (typeof walletManager !== 'undefined') {
                walletManager.showNotification(message, type);
            } else {
                console.log(`${type}: ${message}`);
            }
        }
    }

    // Initialize Deposit System
    const depositSystem = new DepositSystem();

    // Auto-update balance when wallet connects
    if (typeof walletManager !== 'undefined') {
        const originalUpdateUI = walletManager.updateWalletUI;
        walletManager.updateWalletUI = function() {
            originalUpdateUI.call(this);
            depositSystem.updateAvailableBalance();
        };
    }