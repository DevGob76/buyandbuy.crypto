// Variables globales
let users = JSON.parse(localStorage.getItem('cryptoUsers')) || [
    { name: "John Gobolo", phone: "2250586214172" }
];
let archives = JSON.parse(localStorage.getItem('cryptoArchives')) || [];
let loanArchives = JSON.parse(localStorage.getItem('loanArchives')) || [];
let profitData = JSON.parse(localStorage.getItem('profitData')) || [];
let isAuthenticated = false;
const adminSecretCode = "Gob19*20";
const CRYPTO_LIST = [
    { name: 'Bitcoin', symbol: 'BTC', id: 'bitcoin' },
    { name: 'Ethereum', symbol: 'ETH', id: 'ethereum' },
    { name: 'Cardano', symbol: 'ADA', id: 'cardano' },
    { name: 'Solana', symbol: 'SOL', id: 'solana' },
    { name: 'Ripple', symbol: 'XRP', id: 'ripple' },
    { name: 'Dogecoin', symbol: 'DOGE', id: 'dogecoin' },
    { name: 'Polkadot', symbol: 'DOT', id: 'polkadot-new' },
    { name: 'Avalanche', symbol: 'AVAX', id: 'avalanche-2' },
    { name: 'Polygon', symbol: 'MATIC', id: 'matic-network' },
    { name: 'Litecoin', symbol: 'LTC', id: 'litecoin' },
    { name: 'LISTE XSTOCKS', symbol: 'XSTOCKS', id: 'xstocks' },
    { name: 'CRCLX', symbol: 'CRCLX/USDT', id: 'crclx' },
    { name: 'AAPLX', symbol: 'AAPLX/USDT', id: 'aaplx' },
    { name: 'COINX', symbol: 'COINX/USDT', id: 'coinx' },
    { name: 'TSLAX', symbol: 'TSLAX/USDT', id: 'tslax' },
    { name: 'NVDAX', symbol: 'NVDAX/USDT', id: 'nvda' },
    { name: 'AMZNX', symbol: 'AMZNX/USDT', id: 'amznx' },
    { name: 'MSTRX', symbol: 'MSTRX/USDT', id: 'mstrx' },
    { name: 'HOODX', symbol: 'HOODX/USDT', id: 'hoodx' },
    { name: 'GOOGLX', symbol: 'GOOGLX/USDT', id: 'googlx' },
    { name: 'QQQX', symbol: 'QQQX/USDT', id: 'qqqx' },
    { name: 'SPYX', symbol: 'SPYX/USDT', id: 'spy' },
    { name: 'METAX', symbol: 'METAX/USDT', id: 'meta' }
];

function populateCryptoDropdown() {
    const select = document.getElementById('crypto-select');
    CRYPTO_LIST.forEach(crypto => {
        const option = document.createElement('option');
        option.value = crypto.id;
        option.textContent = `${crypto.name} (${crypto.symbol})`;
        select.appendChild(option);
    });
}

async function fetchCryptoPrice(cryptoId) {
    const loader = document.getElementById('price-loader');
    const priceInput = document.getElementById('initial-price');
    try {
        loader.style.display = 'block';
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data[cryptoId] && data[cryptoId].usd) {
            priceInput.value = data[cryptoId].usd;
            priceInput.dispatchEvent(new Event('input'));
        }
    } catch (error) {
        console.error('Failed to fetch crypto price:', error);
    } finally {
        loader.style.display = 'none';
    }
}

function updateStakeAmounts() {
    const budget = parseFloat(document.getElementById('budget').value) || 0;
    for (let i = 1; i <= 4; i++) {
        const rate = parseFloat(document.getElementById(`rate-${i}`).value) || 0;
        const amount = budget * (rate / 100);
        const amountElem = document.getElementById(`stake-amount-${i}`);
        if (amountElem) {
            amountElem.textContent = `Mise: $${amount.toFixed(2)}`;
        }
    }
}

function generateGrid() {
    const initialPrice = parseFloat(document.getElementById('initial-price').value);
    const gridInterval = parseFloat(document.getElementById('grid-interval').value) / 100;
    const triggerDrop = parseFloat(document.getElementById('trigger-drop').value) / 100;
    const numBlocks = parseInt(document.getElementById('num-blocks').value, 10);
    const resultsContainer = document.getElementById('grid-results-container');
    const budget = parseFloat(document.getElementById('budget').value);
    const rate1 = parseFloat(document.getElementById('rate-1').value) / 100;
    const rate2 = parseFloat(document.getElementById('rate-2').value) / 100;
    const rate3 = parseFloat(document.getElementById('rate-3').value) / 100;
    const rate4 = parseFloat(document.getElementById('rate-4').value) / 100;
    const newStakesRates = [rate1, rate2, rate3, rate4];
    const allInputs = [initialPrice, gridInterval, triggerDrop, numBlocks, budget, ...newStakesRates];
    if (allInputs.some(input => isNaN(input) || input < 0) || numBlocks < 1) {
        resultsContainer.innerHTML = `<p style="color: red; text-align: center;">Veuillez entrer des valeurs numériques valides et positives pour tous les champs.</p>`;
        return;
    }
    let currentTriggerPrice = initialPrice * (1 - triggerDrop);
    const blocks = [];
    const stakes = newStakesRates.map(rate => budget * rate);
    for (let i = 0; i < numBlocks; i++) {
        const block = {
            blockNumber: i + 1,
            subBlocks: []
        };
        let priceForBlock = (i === 0) ? initialPrice : blocks[i-1].subBlocks[3].lowerPrice;
        currentTriggerPrice = priceForBlock * (1 - triggerDrop);
        for (let j = 0; j < 4; j++) {
            const lowerPrice = currentTriggerPrice * (1 - gridInterval);
            const upperPrice = currentTriggerPrice * (1 + gridInterval);
            block.subBlocks.push({
                triggerPrice: currentTriggerPrice,
                lowerPrice: lowerPrice,
                upperPrice: upperPrice,
                stake: stakes[j]
            });
            currentTriggerPrice = lowerPrice * (1-triggerDrop);
        }
        blocks.push(block);
    }
    renderTable(blocks, resultsContainer);
}

function renderTable(blocks, container) {
    container.innerHTML = '';
    blocks.forEach(block => {
        const table = document.createElement('table');
        table.classList.add('results-table');
        const tableHead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headerCell = document.createElement('th');
        headerCell.colSpan = 4;
        headerCell.textContent = `Bloc ${block.blockNumber}`;
        headerCell.classList.add('block-header');
        headerRow.appendChild(headerCell);
        tableHead.appendChild(headerRow);
        table.appendChild(tableHead);
        const tableBody = document.createElement('tbody');
        block.subBlocks.forEach((subBlock, index) => {
            const row = document.createElement('tr');
            const triggerCell = document.createElement('td');
            triggerCell.innerHTML = `Déclenchement: <br><b>$${subBlock.triggerPrice.toFixed(4)}</b>`;
            row.appendChild(triggerCell);
            const lowerCell = document.createElement('td');
            lowerCell.innerHTML = `Achat (Limite Basse): <br><b>$${subBlock.lowerPrice.toFixed(4)}</b>`;
            row.appendChild(lowerCell);
            const upperCell = document.createElement('td');
            upperCell.innerHTML = `Vente (Limite Haute): <br><b>$${subBlock.upperPrice.toFixed(4)}</b>`;
            row.appendChild(upperCell);
            const stakeCell = document.createElement('td');
            stakeCell.innerHTML = `Mise: <br><b>$${subBlock.stake.toFixed(2)}</b>`;
            stakeCell.classList.add('currency');
            row.appendChild(stakeCell);
            tableBody.appendChild(row);
        });
        table.appendChild(tableBody);
        container.appendChild(table);
    });
}

function archiveRepartition() {
    const date = document.getElementById('archive-date').value;
    if (!date) {
        showMessagePopup('Erreur', 'Veuillez sélectionner une date d\'archivage.');
        return;
    }
    const archive = {
        date,
        content: document.getElementById('grid-results-container').innerHTML
    };
    archives.push(archive);
    localStorage.setItem('cryptoArchives', JSON.stringify(archives));
    showMessagePopup('Archive Réussie', 'La répartition a été archivée avec succès.');
}

function deleteArchive() {
    archives = [];
    localStorage.setItem('cryptoArchives', JSON.stringify(archives));
    showMessagePopup('Archives Supprimées', 'Toutes les archives ont été supprimées avec succès.');
}

function generateCalendar() {
    const startDateInput = document.getElementById('calendar-start-date').value;
    if (!startDateInput) {
        alert("Veuillez sélectionner une date de début.");
        return;
    }
    const startDate = new Date(startDateInput);
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';
    for (let month = 0; month < 12; month++) {
        const monthStart = new Date(startDate);
        monthStart.setMonth(startDate.getMonth() + month);
        const bullishStart = new Date(monthStart);
        const bullishEnd = new Date(bullishStart);
        bullishEnd.setDate(bullishStart.getDate() + 6);
        const bearishStart = new Date(bullishEnd);
        const bearishEnd = new Date(bullishStart);
        bearishEnd.setDate(bullishStart.getDate() + 13);
        const monthDiv = document.createElement('div');
        monthDiv.className = 'calendar-month';
        const monthTitle = document.createElement('h3');
        monthTitle.textContent = `Mois ${month + 1}`;
        monthDiv.appendChild(monthTitle);
        const bullishDiv = document.createElement('div');
        bullishDiv.className = 'calendar-cell bullish';
        bullishDiv.innerHTML = `
            <div>Date Haussière Début: ${bullishStart.toLocaleDateString()}</div>
            <div>Date Haussière Fin: ${bullishEnd.toLocaleDateString()}</div>
        `;
        monthDiv.appendChild(bullishDiv);
        const bearishDiv = document.createElement('div');
        bearishDiv.className = 'calendar-cell bearish';
        bearishDiv.innerHTML = `
            <div>Date Baissière Début: ${bearishStart.toLocaleDateString()}</div>
            <div>Date Baissière Fin: ${bearishEnd.toLocaleDateString()}</div>
        `;
        monthDiv.appendChild(bearishDiv);
        calendarGrid.appendChild(monthDiv);
    }
}

function updateDates() {
    const daysInput = parseInt(document.getElementById('days-input').value) || 90;
    const cryptoPrice = parseFloat(document.getElementById('crypto-price').value) || 95000;
    const date1Input = document.getElementById('date1');
    const date1 = new Date(date1Input.value);
    if (!date1Input.value) {
        alert("Veuillez sélectionner une date de début.");
        return;
    }
    const date2Input = document.getElementById('date2');
    const date3Input = document.getElementById('date3');
    const date4Input = document.getElementById('date4');
    const date5Input = document.getElementById('date5');
    const date6Input = document.getElementById('date6');
    const date2 = new Date(date1);
    date2.setDate(date1.getDate() + daysInput);
    date2Input.valueAsDate = date2;
    const date3 = new Date(date2);
    date3.setDate(date2.getDate() + daysInput);
    date3Input.valueAsDate = date3;
    const date4 = new Date(date3);
    date4.setDate(date3.getDate() + daysInput);
    date4Input.valueAsDate = date4;
    const date5 = new Date(date4);
    date5.setDate(date4.getDate() + daysInput);
    date5Input.valueAsDate = date5;
    const date6 = new Date(date5);
    date6.setDate(date5.getDate() + daysInput);
    date6Input.valueAsDate = date6;
    updateCryptoPrices(cryptoPrice);
}

function updateCryptoPrices(initialPrice) {
    const rate = 0.22;
    const cryptoPriceColumn = document.getElementById('crypto-price-column');
    const cryptoPriceColumn2 = document.getElementById('crypto-price-column2');
    const price1 = initialPrice * (1 + rate);
    const price2 = price1 * (1 + rate);
    const price3 = price2 * (1 + rate);
    cryptoPriceColumn.innerHTML = `
        <div>${initialPrice.toFixed(2)}</div>
        <div>${price1.toFixed(2)}</div>
    `;
    cryptoPriceColumn2.innerHTML = `
        <div>${price2.toFixed(2)}</div>
        <div>${price3.toFixed(2)}</div>
    `;
}

function updateLoanAmount() {
    const collateralBudget = parseFloat(document.getElementById('collateral-budget').value) || 0;
    const loanRatio = parseFloat(document.getElementById('loan-ratio').value) || 0;
    const loanAmount = collateralBudget * (loanRatio / 100);
    document.getElementById('loan-amount').value = loanAmount.toFixed(2);
    updateDebtRatio();
}

function updateDebtRatio() {
    const collateralBudget = parseFloat(document.getElementById('collateral-budget').value) || 0;
    const loanAmount = parseFloat(document.getElementById('loan-amount').value) || 0;
    const debtRatio = (loanAmount / (collateralBudget + loanAmount)) * 100;
    document.getElementById('debt-ratio').value = debtRatio.toFixed(2);
}

function updateTotalInterest() {
    const loanAmount = parseFloat(document.getElementById('loan-amount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interest-rate').value) || 0;
    const loanDuration = parseFloat(document.getElementById('loan-duration').value) || 0;
    const totalInterest = loanAmount * (interestRate / 100) * loanDuration;
    document.getElementById('total-interest').value = totalInterest.toFixed(4);
    updateTotalRepayment();
}

function updateTotalRepayment() {
    const loanAmount = parseFloat(document.getElementById('loan-amount').value) || 0;
    const totalInterest = parseFloat(document.getElementById('total-interest').value) || 0;
    const totalRepayment = loanAmount + totalInterest;
    document.getElementById('total-repayment').value = totalRepayment.toFixed(4);
}

function updateAllCalculations() {
    updateLoanAmount();
    updateTotalInterest();
}

function archiveLoan() {
    const date = document.getElementById('loan-archive-date').value;
    if (!date) {
        showMessagePopup('Erreur', 'Veuillez sélectionner une date d\'archivage.');
        return;
    }
    const loanData = {
        date,
        collateralBudget: document.getElementById('collateral-budget').value,
        loanRatio: document.getElementById('loan-ratio').value,
        loanAmount: document.getElementById('loan-amount').value,
        debtRatio: document.getElementById('debt-ratio').value,
        interestRate: document.getElementById('interest-rate').value,
        loanDuration: document.getElementById('loan-duration').value,
        totalInterest: document.getElementById('total-interest').value,
        totalRepayment: document.getElementById('total-repayment').value
    };
    loanArchives.push(loanData);
    localStorage.setItem('loanArchives', JSON.stringify(loanArchives));
    populateLoanArchiveSelect();
    showMessagePopup('Archive Réussie', 'Le prêt trading a été archivé avec succès.');
}

function deleteLoanArchive() {
    loanArchives = [];
    localStorage.setItem('loanArchives', JSON.stringify(loanArchives));
    populateLoanArchiveSelect();
    showMessagePopup('Archives Supprimées', 'Toutes les archives de prêt ont été supprimées avec succès.');
}

function populateLoanArchiveSelect() {
    const select = document.getElementById('loan-archive-select');
    select.innerHTML = '<option value="">-- Sélectionner une date --</option>';
    loanArchives.forEach((archive, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = archive.date;
        select.appendChild(option);
    });
}

function displaySelectedArchive() {
    const select = document.getElementById('loan-archive-select');
    const selectedIndex = select.value;
    if (selectedIndex === "") {
        document.getElementById('archive-display').classList.add('hidden');
        return;
    }
    const archive = loanArchives[selectedIndex];
    document.getElementById('display-collateral-budget').value = archive.collateralBudget;
    document.getElementById('display-loan-ratio').value = archive.loanRatio;
    document.getElementById('display-loan-amount').value = archive.loanAmount;
    document.getElementById('display-debt-ratio').value = archive.debtRatio;
    document.getElementById('display-interest-rate').value = archive.interestRate;
    document.getElementById('display-loan-duration').value = archive.loanDuration;
    document.getElementById('display-total-interest').value = archive.totalInterest;
    document.getElementById('display-total-repayment').value = archive.totalRepayment;
    document.getElementById('archive-display').classList.remove('hidden');
}

function addNewRow() {
    const tableBody = document.getElementById('profit-table-body');
    const rowCount = tableBody.rows.length;
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${rowCount + 1}</td>
        <td><input type="date" onchange="updateProfitCalculations()"></td>
        <td><input type="date" onchange="updateProfitCalculations()"></td>
        <td><input type="number" value="300" onchange="updateProfitCalculations()"></td>
        <td><input type="number" value="450" onchange="updateProfitCalculations()"></td>
        <td><input type="number" readonly></td>
        <td><input type="number" readonly></td>
    `;
    tableBody.appendChild(newRow);
    updateProfitCalculations();
}

function updateProfitCalculations() {
    let totalProfit = 0;
    const initialCapital = parseFloat(document.getElementById('initial-capital').value) || 0;
    const rows = document.querySelectorAll('#profit-table-body tr');
    rows.forEach(row => {
        const startBudget = parseFloat(row.cells[3].querySelector('input').value) || 0;
        const endBudget = parseFloat(row.cells[4].querySelector('input').value) || 0;
        const profit = endBudget - startBudget;
        const profitRate = (profit / startBudget) * 100;
        row.cells[5].querySelector('input').value = profit.toFixed(2);
        row.cells[6].querySelector('input').value = profitRate.toFixed(2);
        totalProfit += profit;
    });
    document.getElementById('total-profit').value = totalProfit.toFixed(2);
    updateProfitRate(initialCapital);
}

function updateProfitRate(initialCapital) {
    const totalProfit = parseFloat(document.getElementById('total-profit').value) || 0;
    const profitRate = (totalProfit / initialCapital) * 100;
    document.getElementById('profit-rate').value = profitRate.toFixed(2);
}

function clearAdjustableCells() {
    const rows = document.querySelectorAll('#profit-table-body tr');
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input:not([readonly])');
        inputs.forEach(input => {
            input.value = '';
        });
    });
    document.getElementById('total-profit').value = '0.00';
    document.getElementById('profit-rate').value = '0.00';
}

function changeLanguage() {
    const language = document.getElementById('language-select').value;
    alert(`Langue changée en : ${language}`);
    // Ajoutez ici la logique pour changer la langue de l'application
}

// Navigation entre pages
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function checkAccess(pageId) {
    if (isAuthenticated) {
        showPage(pageId);
    } else {
        showMessagePopup('Accès Refusé', 'Veuillez entrer votre numéro de téléphone pour accéder à cette page.');
    }
}

// Fonction pour valider l'accès
function validateAccess() {
    const phone = document.getElementById('user-phone').value;
    if (!phone) {
        showMessagePopup('Erreur', 'Veuillez saisir votre numéro de téléphone.');
        return;
    }
    const userExists = users.some(user => user.phone === phone);
    if (!userExists) {
        showMessagePopup('Accès Refusé', 'Ce numéro de téléphone n\'est pas enregistré.');
        return;
    }
    isAuthenticated = true;
    showMessagePopup('Accès Autorisé', 'Vous avez accès aux autres pages du site.');
}

// Fonction pour afficher le popup du code secret administrateur
function showAdminSecretPopup() {
    document.getElementById('secret-code-popup').style.display = 'block';
}

// Fonction pour vérifier l'accès administrateur
function checkAdminAccess() {
    const secretCode = document.getElementById('admin-secret').value;
    if (secretCode === adminSecretCode) {
        document.getElementById('secret-code-popup').style.display = 'none';
        showPage('parametres');
    } else {
        showMessagePopup('Accès Refusé', 'Code secret incorrect.');
    }
}

// Fonction pour ajouter un utilisateur
function addUser() {
    const name = document.getElementById('admin-user-name').value;
    const phone = document.getElementById('admin-user-phone').value;
    if (!name || !phone) {
        showMessagePopup('Erreur', 'Veuillez remplir tous les champs obligatoires.');
        return;
    }
    const newUser = { name, phone };
    users.push(newUser);
    localStorage.setItem('cryptoUsers', JSON.stringify(users));
    showMessagePopup('Utilisateur Ajouté', 'L\'utilisateur a été ajouté avec succès !');
    updateAdminUserList();
}

// Fonction pour afficher la liste des utilisateurs dans la section admin
function updateAdminUserList() {
    const userListElement = document.getElementById('admin-user-list');
    userListElement.innerHTML = '';
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <span>${user.name} (${user.phone})</span>
            <button onclick="deleteUser('${user.phone}')">Supprimer</button>
        `;
        userListElement.appendChild(userItem);
    });
}

// Fonction pour supprimer un utilisateur
function deleteUser(phone) {
    users = users.filter(user => user.phone !== phone);
    localStorage.setItem('cryptoUsers', JSON.stringify(users));
    updateAdminUserList();
    showMessagePopup('Utilisateur Supprimé', 'L\'utilisateur a été supprimé avec succès.');
}

// Fonction pour afficher un popup de message
function showMessagePopup(title, message) {
    document.getElementById('popup-title').textContent = title;
    document.getElementById('popup-message').textContent = message;
    document.getElementById('message-popup').style.display = 'block';
}

// Fonction pour fermer le popup de message
function closeMessagePopup() {
    document.getElementById('message-popup').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    populateCryptoDropdown();
    const cryptoSelect = document.getElementById('crypto-select');
    cryptoSelect.addEventListener('change', (e) => {
        fetchCryptoPrice(e.target.value);
    });
    const inputs = document.querySelectorAll('#repartition input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            updateStakeAmounts();
            generateGrid();
        });
    });
    document.getElementById('generate-grid-btn').addEventListener('click', generateGrid);
    // Initialize calendar with today's date
    const today = new Date();
    document.getElementById('calendar-start-date').valueAsDate = today;
    document.getElementById('loan-archive-date').valueAsDate = today;
    generateCalendar();
    fetchCryptoPrice(cryptoSelect.value);
    updateStakeAmounts();
    updateAdminUserList();
    populateLoanArchiveSelect();
});
