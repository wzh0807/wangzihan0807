/* 抓小球小游戏 —— 完整实现
 * 状态机 idle / playing / ended
 * 计时器、小球生成、点击判定、事件冒泡处理、结束弹窗与重开
 */

// ===== 常量 =====
const GAME_DURATION = 120;   // 总时长（秒）
const BALL_SIZE     = 50;    // 小球直径（px）

// ===== 状态变量 =====
const game = {
    state: 'idle',        // 'idle' | 'playing' | 'ended'
    score: 0,
    timeLeft: GAME_DURATION,
    timerId: null
};

// ===== DOM 引用 =====
const $gameArea  = document.getElementById('game-area');
const $startBtn  = document.getElementById('start-btn');
const $ball      = document.getElementById('ball');
const $score     = document.getElementById('score');
const $timer     = document.getElementById('timer');
const $endModal  = document.getElementById('end-modal');
const $finalScore= document.getElementById('final-score');
const $restartBtn= document.getElementById('restart-btn');

// ===== 工具：秒 → mm:ss =====
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// ===== 渲染顶部 =====
function renderStatus() {
    $score.textContent = game.score;
    $timer.textContent = formatTime(game.timeLeft);
}

// ===== 小球刷新（随机新位置，排除当前位置避免原地抖动）=====
function refreshBallPosition() {
    const rect = $gameArea.getBoundingClientRect();
    const maxX = Math.max(rect.width  - BALL_SIZE, 0);
    const maxY = Math.max(rect.height - BALL_SIZE, 0);

    let x, y, tries = 0, currentLeft, currentTop;
    if (!$ball.hidden) {
        const cs = window.getComputedStyle($ball);
        currentLeft = parseFloat(cs.left);
        currentTop  = parseFloat(cs.top);
    }

    do {
        x = Math.floor(Math.random() * (maxX + 1));
        y = Math.floor(Math.random() * (maxY + 1));
        tries++;
    } while (!$ball.hidden && tries < 20 &&
             Math.abs(x - currentLeft) < BALL_SIZE &&
             Math.abs(y - currentTop)  < BALL_SIZE);

    $ball.style.left = x + 'px';
    $ball.style.top  = y + 'px';
}

// ===== 状态切换 =====
function setState(next) {
    game.state = next;
    switch (next) {
        case 'idle':
            $startBtn.hidden = false;
            $ball.hidden = true;
            $endModal.hidden = true;
            renderStatus();
            break;

        case 'playing':
            $startBtn.hidden = true;
            $endModal.hidden = true;
            $ball.hidden = false;
            refreshBallPosition();
            break;

        case 'ended':
            stopTimer();
            $ball.hidden = true;
            $finalScore.textContent = game.score;
            $endModal.hidden = false;
            renderStatus();
            break;
    }
}

// ===== 计时器 =====
function startTimer() {
    stopTimer();
    game.timeLeft = GAME_DURATION;
    renderStatus();
    game.timerId = setInterval(() => {
        game.timeLeft--;
        renderStatus();
        if (game.timeLeft <= 0) setState('ended');
    }, 1000);
}

function stopTimer() {
    if (game.timerId !== null) {
        clearInterval(game.timerId);
        game.timerId = null;
    }
}

// ===== 事件：开始按钮 =====
$startBtn.addEventListener('click', () => {
    game.score = 0;
    setState('playing');
    startTimer();
});

// ===== 事件：再来一局 =====
$restartBtn.addEventListener('click', () => {
    game.score = 0;
    game.timeLeft = GAME_DURATION;
    setState('playing');
    startTimer();
});

// ===== 事件：点击小球（+2 并刷新位置）=====
$ball.addEventListener('click', (e) => {
    e.stopPropagation(); // 阻止冒泡到 gameArea，避免点小球同时又 -1
    if (game.state !== 'playing') return;
    game.score += 2;
    renderStatus();
    refreshBallPosition();
});

// ===== 事件：点击空白区域（-1，冒泡过滤）=====
$gameArea.addEventListener('click', (e) => {
    // 只有真正点到背景本身才减分，过滤掉冒泡上来的小球/按钮点击
    if (e.target !== $gameArea) return;
    if (game.state !== 'playing') return;
    game.score -= 1;
    renderStatus();
});

// ===== 窗口 resize 时把小球拉回可视区域 =====
window.addEventListener('resize', () => {
    if (game.state === 'playing') {
        refreshBallPosition();
    }
});

// ===== 初始化 =====
setState('idle');
renderStatus();
