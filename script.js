document.addEventListener('DOMContentLoaded', () => {
    // Screen elements
    const mainMenu = document.getElementById('main-menu');
    const plinkoStart = document.getElementById('plinko-start');
    const plinkoGame = document.getElementById('plinko-game');
    const plinkoGameOver = document.getElementById('plinko-game-over');
    
    // Button elements
    const plinkoButton = document.getElementById('plinko-button');
    const backToMenuButton = document.getElementById('back-to-menu');
    const plinkoToMenuButton = document.getElementById('plinko-to-menu');
    const plinkoRestartButton = document.getElementById('plinko-restart');
    const plinkoGameOverToMenu = document.getElementById('plinko-game-over-to-menu');
    
    // Plinko game elements
    const moneyButtons = document.querySelectorAll('.money-buttons button');
    const balanceDisplay = document.getElementById('balance');
    const betAmountInput = document.getElementById('bet-amount');
    const setBetButton = document.getElementById('set-bet');
    const dropBallButton = document.getElementById('drop-ball');
    const drop5BallsButton = document.getElementById('drop-5-balls');
    const drop10BallsButton = document.getElementById('drop-10-balls');
    const highModeButton = document.getElementById('high-mode');
    const lowModeButton = document.getElementById('low-mode');
    const grid = document.querySelector('.grid');
    const slots = document.querySelector('.slots');
    const resultsList = document.getElementById('results-list');
    const totalBetsDisplay = document.getElementById('total-bets');
    const totalWinsDisplay = document.getElementById('total-wins');
    const winRateDisplay = document.getElementById('win-rate');
    const finalGamesDisplay = document.getElementById('final-games');
    const finalWinningsDisplay = document.getElementById('final-winnings');
    const finalWinRateDisplay = document.getElementById('final-win-rate');
    
    // Game variables
    let balls = [];
    let pegs = [];
    let balance = 0;
    let currentBet = 1.0;
    let gravity = 0.3;
    let rows = 24;
    let maxMultiplier = 100;
    const bounceFactor = 0.7;
    const minVelocity = 0.05;
    const friction = 0.99;
    let gameActive = true;
    let isAnimating = false;
    let activeBalls = 0;
    let gameEnding = false;
    let gameStats = {
        totalBets: 0,
        totalWins: 0,
        results: []
    };

    // Navigation functions
    function showMainMenu() {
        mainMenu.classList.remove('hidden');
        plinkoStart.classList.add('hidden');
        plinkoGame.classList.add('hidden');
        plinkoGameOver.classList.add('hidden');
    }

    function showPlinkoStart() {
        mainMenu.classList.add('hidden');
        plinkoStart.classList.remove('hidden');
    }

    function showPlinkoGame() {
        plinkoStart.classList.add('hidden');
        plinkoGame.classList.remove('hidden');
    }

    function showPlinkoGameOver() {
        plinkoGame.classList.add('hidden');
        plinkoGameOver.classList.remove('hidden');
        updateFinalStats();
        gameEnding = false;
    }

    // Navigation event listeners
    plinkoButton.addEventListener('click', showPlinkoStart);
    backToMenuButton.addEventListener('click', showMainMenu);
    plinkoToMenuButton.addEventListener('click', showMainMenu);
    plinkoGameOverToMenu.addEventListener('click', showMainMenu);

    // Initialize money selection for Plinko
    moneyButtons.forEach(button => {
        button.addEventListener('click', () => {
            balance = parseFloat(button.dataset.amount);
            updateBalance();
            createGrid(rows);
            createSlots(rows, maxMultiplier);
            showPlinkoGame();
        });
    });

    // Set bet amount
    setBetButton.addEventListener('click', () => {
        const newBet = parseFloat(betAmountInput.value);
        if (isNaN(newBet)) {
            alert('Please enter a valid number');
            betAmountInput.value = currentBet.toFixed(1);
            return;
        }
        
        if (newBet < 0.1) {
            alert('Minimum bet is €0.1');
            betAmountInput.value = currentBet.toFixed(1);
            return;
        }
        
        currentBet = parseFloat(newBet.toFixed(1));
        betAmountInput.value = currentBet.toFixed(1);
    });

    // Update balance display
    function updateBalance() {
        balanceDisplay.textContent = `€${balance.toFixed(1)}`;
        if (balance < 0.1 && !isAnimating && !gameEnding) {
            endGame();
        }
    }

    // End game when balance is too low
    function endGame() {
        if (activeBalls > 0) {
            gameEnding = true;
            gameActive = false;
        } else {
            showPlinkoGameOver();
        }
    }

    // Restart game
    plinkoRestartButton.addEventListener('click', () => {
        gameStats = {
            totalBets: 0,
            totalWins: 0,
            results: []
        };
        updateStatsDisplay();
        resultsList.innerHTML = '';
        showPlinkoStart();
        gameActive = true;
        gameEnding = false;
    });

    // Update game statistics
    function updateStatsDisplay() {
        totalBetsDisplay.textContent = gameStats.totalBets;
        totalWinsDisplay.textContent = gameStats.totalWins;
        const winRate = gameStats.totalBets > 0 ? (gameStats.totalWins / gameStats.totalBets * 100).toFixed(1) : 0;
        winRateDisplay.textContent = `${winRate}%`;
    }

    function updateFinalStats() {
        finalGamesDisplay.textContent = gameStats.totalBets;
        const totalWinnings = gameStats.results.reduce((sum, result) => sum + result.winnings, 0);
        finalWinningsDisplay.textContent = `€${totalWinnings.toFixed(1)}`;
        const winRate = gameStats.totalBets > 0 ? (gameStats.totalWins / gameStats.totalBets * 100).toFixed(1) : 0;
        finalWinRateDisplay.textContent = `${winRate}%`;
    }

    // Create the grid of pegs
    function createGrid(rows) {
        grid.innerHTML = '';
        pegs = [];
        const pegSize = 12;
        const spacing = 30;
        const gridWidth = (rows * spacing) + pegSize;
        
        grid.style.width = `${gridWidth}px`;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col <= row; col++) {
                const peg = document.createElement('div');
                peg.classList.add('peg');
                peg.style.left = `${col * spacing - (row * spacing / 2) + gridWidth / 2}px`;
                peg.style.top = `${row * spacing}px`;
                grid.appendChild(peg);
                pegs.push(peg);
            }
        }
    }

    // Create the slots at the bottom with inverted multipliers
    function createSlots(rows, maxMultiplier) {
        slots.innerHTML = '';
        const slotCount = rows + 1;
        
        const multipliers = [];
        const center = Math.floor(rows / 2);
        
        for (let i = 0; i < slotCount; i++) {
            const distanceFromCenter = Math.abs(i - center);
            let multiplier;
            
            if (rows === 24) { // High mode
                const normalizedDistance = distanceFromCenter / center;
                multiplier = 0.2 + (maxMultiplier - 0.2) * Math.pow(normalizedDistance, 2.5);
                
                const randomFactor = 1 + (Math.random() - 0.5) * 0.1;
                multiplier *= randomFactor;
                
                multiplier = parseFloat(Math.max(0.2, Math.min(maxMultiplier, multiplier).toFixed(1)));
                
                if (distanceFromCenter <= 2) {
                    if (Math.random() < 0.4) {
                        multiplier = 0.2;
                    } else if (Math.random() < 0.7) {
                        multiplier = parseFloat(Math.min(1, multiplier).toFixed(1));
                    }
                }
            } else { // Low mode
                multiplier = parseFloat((0.2 + (distanceFromCenter * (maxMultiplier-0.2)/center)).toFixed(1));
                
                if (distanceFromCenter <= 1) {
                    if (Math.random() < 0.5) {
                        multiplier = 0.2;
                    }
                }
            }
            
            multipliers.push(multiplier);
        }

        const middleIndex = Math.floor(slotCount / 2);
        multipliers[middleIndex] = 0.2;
        
        if (middleIndex > 0) multipliers[middleIndex - 1] = parseFloat(Math.min(0.5, multipliers[middleIndex - 1]).toFixed(1));
        if (middleIndex < slotCount - 1) multipliers[middleIndex + 1] = parseFloat(Math.min(0.5, multipliers[middleIndex + 1]).toFixed(1));

        for (let i = 0; i < slotCount; i++) {
            const slot = document.createElement('div');
            slot.classList.add('slot');
            slot.textContent = `${multipliers[i].toFixed(1)}x`;
            
            if (multipliers[i] >= maxMultiplier * 0.9) {
                slot.classList.add('high-value');
            } else if (multipliers[i] <= 0.5) {
                slot.classList.add('low-value');
            } else if (multipliers[i] <= 1) {
                slot.classList.add('medium-low-value');
            }

            slots.appendChild(slot);
        }
    }

    // Add result to the results list
    function addResult(multiplier, winnings) {
        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item');
        const isWin = winnings >= currentBet;
        resultItem.classList.add(isWin ? 'win' : 'loss');
        
        const multiplierSpan = document.createElement('span');
        multiplierSpan.textContent = `${multiplier.toFixed(1)}x`;
        
        const winningsSpan = document.createElement('span');
        winningsSpan.textContent = `€${winnings.toFixed(1)}`;
        
        resultItem.appendChild(multiplierSpan);
        resultItem.appendChild(winningsSpan);
        resultsList.insertBefore(resultItem, resultsList.firstChild);
        
        // Update game stats
        gameStats.totalBets++;
        if (isWin) gameStats.totalWins++;
        gameStats.results.push({ multiplier, winnings });
        updateStatsDisplay();
        
        // Limit to 50 results
        if (resultsList.children.length > 50) {
            resultsList.removeChild(resultsList.lastChild);
        }
    }

    // Drop one or more balls
// V script.js zamenjajte funkcijo dropBalls s to novo verzijo:
function dropBalls(count = 1) {
    if (!gameActive) return;
    
    const totalBet = parseFloat((currentBet * count).toFixed(1));
    if (totalBet > balance) {
        alert(`You don't have enough balance for ${count} balls (needed: €${totalBet}, have: €${balance.toFixed(1)})`);
        return;
    }
    
    balance = parseFloat((balance - totalBet).toFixed(1));
    updateBalance();
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            dropSingleBall();
        }, i * 200);
    }
}

// In posodobite funkcijo animateBall (spremenite zadnji del):
function animateBall(ballData) {
    // ... obstoječa koda ...

    if (newTop >= grid.offsetHeight - 15) {
        const ballCenterX = newLeft + 6;
        const slotElements = document.querySelectorAll('.slot');
        const slotWidth = 30;
        const firstSlotLeft = grid.offsetWidth / 2 - (rows * 15);
        const slotIndex = Math.floor((ballCenterX - firstSlotLeft) / slotWidth);
        
        if (slotIndex >= 0 && slotIndex < slotElements.length) {
            const multiplierText = slotElements[slotIndex].textContent;
            const multiplier = parseFloat(multiplierText.replace('x', ''));
            const winnings = parseFloat((currentBet * multiplier).toFixed(1));
            
            balance = parseFloat((balance + winnings).toFixed(1));
            updateBalance();
            
            addResult(multiplier, winnings);
            
            slotElements[slotIndex].classList.add('landed');
            setTimeout(() => {
                slotElements[slotIndex].classList.remove('landed');
            }, 500);
        }
        grid.removeChild(element);
        balls = balls.filter(b => b !== ballData);
        
        // Odstranili smo preverjanje activeBalls in gameEnding
    } else {
        requestAnimationFrame(() => animateBall(ballData));
    }
}

    function dropSingleBall() {
        const ball = document.createElement('div');
        ball.classList.add('ball');
        
        // Center-biased starting position
        let startOffset;
        const rand = Math.random();
        if (rand < 0.7) { // 70% center
            startOffset = (Math.random() - 0.5) * 15;
        } else if (rand < 0.9) { // 20% medium
            startOffset = (Math.random() - 0.5) * 40;
        } else { // 10% edge
            startOffset = (Math.random() - 0.5) * 80;
        }
        
        // Apply center bias
        const centerBias = 0.3;
        startOffset *= (1 - centerBias);
        
        ball.style.left = `${grid.offsetWidth / 2 - 6 + startOffset}px`;
        ball.style.top = '0px';
        grid.appendChild(ball);

        let velocityY = 0;
        let velocityX = (Math.random() - 0.5) * 2 * (1 - centerBias);

        balls.push({ element: ball, velocityY, velocityX });
        animateBall({ element: ball, velocityY, velocityX });
    }

    function animateBall(ballData) {
        const { element, velocityY, velocityX } = ballData;

        ballData.velocityY += gravity;
        ballData.velocityX *= friction;
        ballData.velocityY *= friction;

        const newTop = parseFloat(element.style.top) + velocityY;
        const newLeft = parseFloat(element.style.left) + velocityX;

        pegs.forEach(peg => {
            const pegRect = peg.getBoundingClientRect();
            const ballRect = element.getBoundingClientRect();

            const ballCenterX = ballRect.left + ballRect.width / 2;
            const ballCenterY = ballRect.top + ballRect.height / 2;
            const pegCenterX = pegRect.left + pegRect.width / 2;
            const pegCenterY = pegRect.top + pegRect.height / 2;

            const dx = ballCenterX - pegCenterX;
            const dy = ballCenterY - pegCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const minDistance = (ballRect.width / 2) + (pegRect.width / 2);
            if (distance < minDistance) {
                const nx = dx / distance;
                const ny = dy / distance;
                const dotProduct = velocityX * nx + velocityY * ny;

                if (dotProduct < 0) {
                    ballData.velocityX = (-2 * dotProduct * nx + velocityX) * bounceFactor;
                    ballData.velocityY = (-2 * dotProduct * ny + velocityY) * bounceFactor;
                    const overlap = minDistance - distance;
                    ballData.element.style.left = `${newLeft + nx * overlap}px`;
                    ballData.element.style.top = `${newTop + ny * overlap}px`;
                }
            }
        });

        element.style.top = `${newTop}px`;
        element.style.left = `${newLeft}px`;

        if (Math.abs(ballData.velocityX) < minVelocity) ballData.velocityX = 0;
        if (Math.abs(ballData.velocityY) < minVelocity) ballData.velocityY = 0;

        if (newTop >= grid.offsetHeight - 15) {
            const ballCenterX = newLeft + 6;
            const slotElements = document.querySelectorAll('.slot');
            const slotWidth = 30;
            const firstSlotLeft = grid.offsetWidth / 2 - (rows * 15);
            const slotIndex = Math.floor((ballCenterX - firstSlotLeft) / slotWidth);
            
            if (slotIndex >= 0 && slotIndex < slotElements.length) {
                const multiplierText = slotElements[slotIndex].textContent;
                const multiplier = parseFloat(multiplierText.replace('x', ''));
                const winnings = parseFloat((currentBet * multiplier).toFixed(1));
                
                // Add winnings to balance
                balance = parseFloat((balance + winnings).toFixed(1));
                updateBalance();
                
                // Add result to the list
                addResult(multiplier, winnings);
                
                // Flash the slot where ball landed
                slotElements[slotIndex].classList.add('landed');
                setTimeout(() => {
                    slotElements[slotIndex].classList.remove('landed');
                }, 500);
            }
            grid.removeChild(element);
            balls = balls.filter(b => b !== ballData);
            
            activeBalls--;
            if (activeBalls <= 0) {
                isAnimating = false;
                if (gameEnding) {
                    showPlinkoGameOver();
                }
            }
        } else {
            requestAnimationFrame(() => animateBall(ballData));
        }
    }

    // Event listeners for ball drops
    dropBallButton.addEventListener('click', () => dropBalls(1));
    drop5BallsButton.addEventListener('click', () => dropBalls(5));
    drop10BallsButton.addEventListener('click', () => dropBalls(10));

    // Game mode switching
    function setGameMode(mode) {
        if (mode === 'high') {
            rows = 24;
            maxMultiplier = 100;
            gravity = 0.3;
            highModeButton.classList.add('active');
            lowModeButton.classList.remove('active');
        } else {
            rows = 12;
            maxMultiplier = 10;
            gravity = 0.2;
            lowModeButton.classList.add('active');
            highModeButton.classList.remove('active');
        }
        createGrid(rows);
        createSlots(rows, maxMultiplier);
    }

    highModeButton.addEventListener('click', () => setGameMode('high'));
    lowModeButton.addEventListener('click', () => setGameMode('low'));

    // Initialize with main menu
    showMainMenu();
    setGameMode('high');
});
