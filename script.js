// ================================
// GLOBAL VARIABLES
// ================================
let currentLevel = '';
let currentMode = '';
let currentQuestion = {};
let score = 0;
let lives = 3;
let questionNumber = 1;
let totalQuestions = 40;
let timer = 60;
let timerInterval = null;
let correctCount = 0;
let wrongCount = 0;
let combo = 0;
let maxCombo = 0;
let lastAnswerTime = Date.now();
let gameActive = false;

// ================================
// SCREEN NAVIGATION
// ================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showMainMenu() {
    showScreen('mainMenu');
    resetGame();
}

function showLevelSelect() {
    showScreen('levelSelect');
}

function showModeSelect() {
    showScreen('modeSelect');
}

function showHowToPlay() {
    showScreen('howToPlay');
}

function showHighScore() {
    loadHighScores();
    showScreen('highScoreScreen');
}

// ================================
// GAME INITIALIZATION
// ================================
function selectLevel(level) {
    currentLevel = level;
    showModeSelect();
}

function startGame(mode) {
    currentMode = mode;
    resetGame();
    gameActive = true;
    
    // Setup UI based on mode
    setupGameMode();
    
    // Generate first question
    generateQuestion();
    
    // Start timer for time mode
    if (currentMode === 'time') {
        startTimer();
    }
    
    // Focus on input
    document.getElementById('answerInput').focus();
    
    showScreen('gameScreen');
}

function setupGameMode() {
    const timerBox = document.getElementById('timerBox');
    const livesBox = document.getElementById('livesBox');
    const questionCountBox = document.getElementById('questionCountBox');
    const progressContainer = document.getElementById('progressContainer');
    
    // Hide all by default
    timerBox.style.display = 'none';
    livesBox.style.display = 'none';
    questionCountBox.style.display = 'none';
    progressContainer.style.display = 'none';
    
    // Show relevant UI elements based on mode
    if (currentMode === 'time') {
        timerBox.style.display = 'block';
        progressContainer.style.display = 'block';
        timer = 60;
        document.getElementById('timer').textContent = timer;
    } else if (currentMode === 'survival') {
        livesBox.style.display = 'block';
        lives = 3;
        updateLives();
    } else if (currentMode === 'challenge') {
        questionCountBox.style.display = 'block';
        questionNumber = 1;
        totalQuestions = 40;
        updateQuestionCount();
    }
}

function resetGame() {
    score = 0;
    lives = 3;
    questionNumber = 1;
    correctCount = 0;
    wrongCount = 0;
    combo = 0;
    maxCombo = 0;
    gameActive = false;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    document.getElementById('score').textContent = '0';
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('answerInput').value = '';
    document.getElementById('comboBadge').style.display = 'none';
}

// ================================
// QUESTION GENERATION
// ================================
function generateQuestion() {
    if (!gameActive) return;
    
    let num1, num2, operator, answer;
    const operators = getOperatorsForLevel();
    const range = getRangeForLevel();
    
    operator = operators[Math.floor(Math.random() * operators.length)];
    
    // Generate numbers based on operator
    if (operator === '÷') {
        // For division, ensure whole number result
        num2 = Math.floor(Math.random() * (range.max - 1)) + 1;
        answer = Math.floor(Math.random() * (range.max - 1)) + 1;
        num1 = num2 * answer;
    } else if (operator === '×') {
        num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        answer = num1 * num2;
    } else if (operator === '+') {
        num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        answer = num1 + num2;
    } else if (operator === '−') {
        num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        num2 = Math.floor(Math.random() * num1) + 1; // Ensure positive result
        answer = num1 - num2;
    }
    
    currentQuestion = {
        num1,
        num2,
        operator,
        answer
    };
    
    document.getElementById('question').textContent = `${num1} ${operator} ${num2} = ?`;
    document.getElementById('answerInput').value = '';
    document.getElementById('answerInput').focus();
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    
    lastAnswerTime = Date.now();
}

function getOperatorsForLevel() {
    switch (currentLevel) {
        case 'mudah':
            return ['+', '−'];
        case 'sedang':
            return ['×', '÷'];
        case 'sulit':
            return ['+', '−', '×', '÷'];
        case 'expert':
            return ['+', '−', '×', '÷'];
        default:
            return ['+', '−'];
    }
}

function getRangeForLevel() {
    switch (currentLevel) {
        case 'mudah':
            return { min: 1, max: 20 };
        case 'sedang':
            return { min: 1, max: 10 };
        case 'sulit':
            return { min: 1, max: 50 };
        case 'expert':
            return { min: 1, max: 100 };
        default:
            return { min: 1, max: 20 };
    }
}

// ================================
// ANSWER CHECKING
// ================================
function checkAnswer() {
    if (!gameActive) return;
    
    const userAnswer = parseInt(document.getElementById('answerInput').value);
    
    if (isNaN(userAnswer)) {
        showFeedback('Masukkan angka!', 'wrong');
        return;
    }
    
    const answerTime = Date.now() - lastAnswerTime;
    const isCorrect = userAnswer === currentQuestion.answer;
    
    if (isCorrect) {
        handleCorrectAnswer(answerTime);
    } else {
        handleWrongAnswer();
    }
    
    // Check game end conditions
    if (currentMode === 'challenge' && questionNumber > totalQuestions) {
        endGame();
    } else if (currentMode === 'survival' && lives <= 0) {
        endGame();
    } else {
        // Generate next question
        setTimeout(() => {
            generateQuestion();
        }, 1000);
    }
}

function handleCorrectAnswer(answerTime) {
    correctCount++;
    
    // Calculate combo bonus (if answered within 3 seconds)
    let points = 10;
    if (answerTime < 3000) {
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        
        if (combo >= 2) {
            points = 10 * combo;
            showCombo();
        }
    } else {
        combo = 0;
        hideCombo();
    }
    
    score += points;
    document.getElementById('score').textContent = score;
    
    showFeedback(`✓ Benar! +${points} poin`, 'correct');
    playSound('correct');
    
    if (currentMode === 'challenge') {
        questionNumber++;
        updateQuestionCount();
    }
}

function handleWrongAnswer() {
    wrongCount++;
    combo = 0;
    hideCombo();
    
    showFeedback(`✗ Salah! Jawaban: ${currentQuestion.answer}`, 'wrong');
    playSound('wrong');
    
    if (currentMode === 'survival') {
        lives--;
        updateLives();
    } else if (currentMode !== 'survival') {
        score = Math.max(0, score - 5);
        document.getElementById('score').textContent = score;
    }
    
    if (currentMode === 'challenge') {
        questionNumber++;
        updateQuestionCount();
    }
}

function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
}

function showCombo() {
    const comboBadge = document.getElementById('comboBadge');
    const comboText = document.getElementById('comboText');
    comboText.textContent = `COMBO x${combo}! 🔥`;
    comboBadge.style.display = 'block';
}

function hideCombo() {
    document.getElementById('comboBadge').style.display = 'none';
}

// ================================
// TIMER MANAGEMENT
// ================================
function startTimer() {
    const progressBar = document.getElementById('progressBar');
    const timerDisplay = document.getElementById('timer');
    
    timerInterval = setInterval(() => {
        timer--;
        timerDisplay.textContent = timer;
        
        // Update progress bar
        const progress = (timer / 60) * 100;
        progressBar.style.width = progress + '%';
        
        // Change color based on remaining time
        if (timer <= 10) {
            progressBar.style.background = 'linear-gradient(90deg, #fa709a 0%, #fee140 100%)';
        }
        
        if (timer <= 0) {
            endGame();
        }
    }, 1000);
}

// ================================
// UI UPDATES
// ================================
function updateLives() {
    const hearts = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
    document.getElementById('lives').textContent = hearts;
}

function updateQuestionCount() {
    document.getElementById('questionCount').textContent = `${questionNumber}/${totalQuestions}`;
}

// ================================
// GAME CONTROL
// ================================
function pauseGame() {
    if (!gameActive) return;
    
    gameActive = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    const resume = confirm('Game dijeda.\n\nKlik OK untuk melanjutkan.');
    if (resume) {
        gameActive = true;
        if (currentMode === 'time') {
            startTimer();
        }
    } else {
        quitGame();
    }
}

function quitGame() {
    const confirm_quit = confirm('Yakin ingin keluar?\n\nProgress game akan hilang.');
    if (confirm_quit) {
        endGame();
    } else if (!gameActive) {
        // Resume if user cancels quit after pause
        gameActive = true;
        if (currentMode === 'time') {
            startTimer();
        }
    }
}

function endGame() {
    gameActive = false;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Display final stats
    document.getElementById('finalScore').textContent = score;
    document.getElementById('correctAnswers').textContent = correctCount;
    document.getElementById('wrongAnswers').textContent = wrongCount;
    document.getElementById('maxCombo').textContent = maxCombo;
    
    // Check and save high score
    const isNewHighScore = checkAndSaveHighScore();
    if (isNewHighScore) {
        document.getElementById('newHighScore').style.display = 'block';
    } else {
        document.getElementById('newHighScore').style.display = 'none';
    }
    
    showScreen('gameOver');
}

function restartGame() {
    startGame(currentMode);
}

// ================================
// HIGH SCORE MANAGEMENT
// ================================
function checkAndSaveHighScore() {
    const highScores = JSON.parse(localStorage.getItem('mathGameHighScores') || '[]');
    
    const newScore = {
        score: score,
        level: currentLevel,
        mode: currentMode,
        date: new Date().toLocaleDateString('id-ID')
    };
    
    // Check if it's a high score for this level/mode combination
    const existingScore = highScores.find(
        s => s.level === currentLevel && s.mode === currentMode
    );
    
    let isNewHighScore = false;
    
    if (!existingScore || score > existingScore.score) {
        isNewHighScore = true;
        
        // Remove old score for this level/mode if exists
        const filteredScores = highScores.filter(
            s => !(s.level === currentLevel && s.mode === currentMode)
        );
        
        // Add new score
        filteredScores.push(newScore);
        
        // Sort by score descending
        filteredScores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        const topScores = filteredScores.slice(0, 10);
        
        localStorage.setItem('mathGameHighScores', JSON.stringify(topScores));
    }
    
    return isNewHighScore;
}

function loadHighScores() {
    const highScores = JSON.parse(localStorage.getItem('mathGameHighScores') || '[]');
    const highScoreList = document.getElementById('highScoreList');
    
    if (highScores.length === 0) {
        highScoreList.innerHTML = '<div class="highscore-empty">Belum ada high score.<br>Ayo mulai bermain!</div>';
        return;
    }
    
    highScoreList.innerHTML = '';
    
    highScores.forEach((scoreData, index) => {
        const row = document.createElement('div');
        row.className = 'highscore-row';
        
        const levelNames = {
            'mudah': '😊 Mudah',
            'sedang': '🤔 Sedang',
            'sulit': '😎 Sulit',
            'expert': '🔥 Expert'
        };
        
        const modeNames = {
            'time': '⏱️ Waktu',
            'survival': '❤️ Survival',
            'challenge': '🎯 Tantangan'
        };
        
        row.innerHTML = `
            <span>${levelNames[scoreData.level] || scoreData.level}</span>
            <span>${modeNames[scoreData.mode] || scoreData.mode}</span>
            <span style="font-weight: bold; color: #667eea;">${scoreData.score}</span>
        `;
        
        highScoreList.appendChild(row);
    });
}

function clearHighScores() {
    const confirm_clear = confirm('Yakin ingin menghapus semua high score?\n\nTindakan ini tidak bisa dibatalkan.');
    if (confirm_clear) {
        localStorage.removeItem('mathGameHighScores');
        loadHighScores();
    }
}

// ================================
// SOUND EFFECTS
// ================================
function playSound(type) {
    try {
        const sound = document.getElementById(type + 'Sound');
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => {
                // Silently fail if audio can't play
                console.log('Audio playback failed:', e);
            });
        }
    } catch (e) {
        // Silently fail
    }
}

// ================================
// KEYBOARD SUPPORT
// ================================
document.addEventListener('DOMContentLoaded', function() {
    const answerInput = document.getElementById('answerInput');
    
    if (answerInput) {
        answerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkAnswer();
            }
        });
    }
});

// ================================
// PREVENT CONTEXT MENU (optional)
// ================================
document.addEventListener('contextmenu', function(e) {
    if (gameActive) {
        e.preventDefault();
    }
});

// ================================
// INITIALIZATION
// ================================
window.onload = function() {
    showMainMenu();
};