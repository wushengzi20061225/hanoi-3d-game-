/**
 * Tower of Hanoi 3D Game
 * Web Design Course Project
 * Implements: Arrays, Objects, Events, CSS Animations
 */

// 游戏主类
class HanoiGame {
    constructor() {
        // 游戏状态对象
        this.state = {
            disksCount: 5,
            pegs: [[], [], []], // 使用数组表示三个柱子
            moves: 0,
            isAutoSolving: false,
            selectedPegIndex: null,
            selectedDiskSize: null,
            moveHistory: [], // 撤销功能的历史记录
            isSolved: false
        };
        
        this.init();
    }
    
    /**
     * 初始化游戏
     */
    init() {
        this.DOM = {
            pegsContainer: document.getElementById('pegs-container'),
            diskCountInput: document.getElementById('disk-count'),
            diskCountSlider: document.getElementById('disk-count-slider'),
            moveCounter: document.getElementById('move-counter'),
            minMoves: document.getElementById('min-moves'),
            currentDisks: document.getElementById('current-disks'),
            hintMinMoves: document.getElementById('hint-min-moves'),
            resetBtn: document.getElementById('reset-btn'),
            autoSolveBtn: document.getElementById('auto-solve-btn'),
            undoBtn: document.getElementById('undo-btn'),
            warningMessage: document.getElementById('warning-message'),
            warningText: document.getElementById('warning-text'),
            victoryModal: document.getElementById('victory-modal'),
            finalMoves: document.getElementById('final-moves'),
            finalDisks: document.getElementById('final-disks'),
            optimalMoves: document.getElementById('optimal-moves'),
            playAgainBtn: document.getElementById('play-again-btn'),
            closeVictoryBtn: document.getElementById('close-victory-btn')
        };
        
        this.setupEventListeners();
        this.resetGame();
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 圆盘数量变化
        this.DOM.diskCountInput.addEventListener('change', (e) => {
            const value = Math.min(8, Math.max(3, parseInt(e.target.value) || 5));
            this.DOM.diskCountInput.value = value;
            this.DOM.diskCountSlider.value = value;
            this.state.disksCount = value;
            this.resetGame();
        });
        
        this.DOM.diskCountSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.DOM.diskCountInput.value = value;
            this.state.disksCount = value;
            this.resetGame();
        });
        
        // 按钮事件
        this.DOM.resetBtn.addEventListener('click', () => this.resetGame());
        this.DOM.autoSolveBtn.addEventListener('click', () => this.autoSolve());
        this.DOM.undoBtn.addEventListener('click', () => this.undoMove());
        this.DOM.playAgainBtn.addEventListener('click', () => this.hideVictoryModal());
        this.DOM.closeVictoryBtn.addEventListener('click', () => this.hideVictoryModal());
        
        // 更新提示中的最小步数
        this.updateMinMovesDisplay();
    }
    
    /**
     * 重置游戏状态
     */
    resetGame() {
        // 重置状态
        this.state.pegs = [[], [], []];
        this.state.moves = 0;
        this.state.selectedPegIndex = null;
        this.state.selectedDiskSize = null;
        this.state.moveHistory = [];
        this.state.isAutoSolving = false;
        this.state.isSolved = false;
        
        // 初始化柱子A上的圆盘
        for (let i = this.state.disksCount; i >= 1; i--) {
            this.state.pegs[0].push(i);
        }
        
        // 更新显示
        this.updateMinMovesDisplay();
        this.render();
        this.updateUI();
        this.hideVictoryModal();
    }
    
    /**
     * 更新最小步数显示
     */
    updateMinMovesDisplay() {
        const minMoves = Math.pow(2, this.state.disksCount) - 1;
        this.DOM.minMoves.textContent = minMoves;
        this.DOM.currentDisks.textContent = this.state.disksCount;
        this.DOM.hintMinMoves.textContent = minMoves;
    }
    
    /**
     * 渲染游戏棋盘
     */
    render() {
        this.DOM.pegsContainer.innerHTML = '';
        
        // 创建三个柱子
        for (let i = 0; i < 3; i++) {
            const pegElement = document.createElement('div');
            pegElement.className = 'peg';
            pegElement.dataset.index = i;
            
            // 为柱子添加点击事件
            pegElement.addEventListener('click', (e) => this.handlePegClick(i));
            
            // 创建柱子上的圆盘
            // 使用 forEach 数组方法（项目要求）
            this.state.pegs[i].forEach(diskSize => {
                const diskElement = this.createDiskElement(diskSize);
                pegElement.appendChild(diskElement);
            });
            
            this.DOM.pegsContainer.appendChild(pegElement);
        }
    }
    
    /**
     * 创建圆盘DOM元素
     */
    createDiskElement(size) {
        const disk = document.createElement('div');
        disk.className = 'disk';
        disk.dataset.size = size;
        disk.textContent = size;
        
        // 添加拖拽事件
        disk.addEventListener('mousedown', (e) => this.startDrag(e, disk));
        disk.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleDiskClick(size, e.target.closest('.peg').dataset.index);
        });
        
        // 添加触摸事件支持
        disk.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrag(e, disk);
        });
        
        return disk;
    }
    
    /**
     * 开始拖拽
     */
    startDrag(e, disk) {
        if (this.state.isAutoSolving || this.state.isSolved) return;
        
        const pegElement = disk.closest('.peg');
        const pegIndex = parseInt(pegElement.dataset.index);
        
        // 检查是否可拖拽（只能拖拽最上面的圆盘）
        if (this.getTopDiskSize(pegIndex) === parseInt(disk.dataset.size)) {
            this.selectDisk(pegIndex);
            
            const startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            const diskRect = disk.getBoundingClientRect();
            
            const moveHandler = (moveEvent) => {
                moveEvent.preventDefault();
                const currentX = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientX : moveEvent.clientX;
                const currentY = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientY : moveEvent.clientY;
                
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                
                disk.style.transform = `translate(${deltaX}px, ${deltaY}px) translateZ(20px)`;
            };
            
            const endHandler = (endEvent) => {
                endEvent.preventDefault();
                
                // 移除事件监听器
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', endHandler);
                document.removeEventListener('touchmove', moveHandler);
                document.removeEventListener('touchend', endHandler);
                
                // 重置变换
                disk.style.transform = '';
                
                // 查找放置目标
                const endX = endEvent.type === 'touchend' ? endEvent.changedTouches[0].clientX : endEvent.clientX;
                const endY = endEvent.type === 'touchend' ? endEvent.changedTouches[0].clientY : endEvent.clientY;
                
                const targetPeg = this.findPegAtPosition(endX, endY);
                if (targetPeg !== null && targetPeg !== pegIndex) {
                    this.handlePegClick(targetPeg);
                }
                
                this.deselectDisk();
            };
            
            // 添加事件监听器
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', endHandler);
            document.addEventListener('touchmove', moveHandler, { passive: false });
            document.addEventListener('touchend', endHandler, { passive: false });
        }
    }
    
    /**
     * 根据坐标查找柱子
     */
    findPegAtPosition(x, y) {
        const pegs = document.querySelectorAll('.peg');
        for (let i = 0; i < pegs.length; i++) {
            const rect = pegs[i].getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return i;
            }
        }
        return null;
    }
    
    /**
     * 处理圆盘点击
     */
    handleDiskClick(diskSize, pegIndex) {
        if (this.state.isAutoSolving || this.state.isSolved) return;
        
        // 如果已选择圆盘，则尝试移动
        if (this.state.selectedPegIndex !== null) {
            this.handlePegClick(pegIndex);
        } 
        // 否则选择圆盘
        else if (this.getTopDiskSize(pegIndex) === diskSize) {
            this.selectDisk(pegIndex);
        }
    }
    
    /**
     * 处理柱子点击
     */
    handlePegClick(pegIndex) {
        if (this.state.isAutoSolving || this.state.isSolved) return;
        
        // 如果已选择圆盘，尝试移动
        if (this.state.selectedPegIndex !== null) {
            this.attemptMove(this.state.selectedPegIndex, pegIndex);
        } 
        // 否则选择柱子最上面的圆盘
        else {
            const topDiskSize = this.getTopDiskSize(pegIndex);
            if (topDiskSize !== null) {
                this.selectDisk(pegIndex);
            }
        }
    }
    
    /**
     * 选择圆盘
     */
    selectDisk(pegIndex) {
        const topDiskSize = this.getTopDiskSize(pegIndex);
        if (topDiskSize !== null) {
            this.state.selectedPegIndex = pegIndex;
            this.state.selectedDiskSize = topDiskSize;
            
            // 视觉反馈
            const pegElement = document.querySelectorAll('.peg')[pegIndex];
            const diskElement = pegElement.querySelector('.disk:last-child');
            if (diskElement) {
                diskElement.classList.add('selected');
            }
        }
    }
    
    /**
     * 取消选择圆盘
     */
    deselectDisk() {
        this.state.selectedPegIndex = null;
        this.state.selectedDiskSize = null;
        
        // 移除视觉反馈
        document.querySelectorAll('.disk.selected').forEach(disk => {
            disk.classList.remove('selected');
        });
    }
    
    /**
     * 获取柱子最上面的圆盘大小
     */
    getTopDiskSize(pegIndex) {
        const peg = this.state.pegs[pegIndex];
        if (peg.length === 0) return null;
        return peg[peg.length - 1];
    }
    
    /**
     * 尝试移动圆盘
     */
    attemptMove(fromPeg, toPeg) {
        if (fromPeg === toPeg) {
            this.deselectDisk();
            return;
        }
        
        // 验证移动是否有效
        if (this.isValidMove(fromPeg, toPeg)) {
            this.executeMove(fromPeg, toPeg);
            
            // 检查是否获胜
            if (this.checkWin()) {
                this.showVictory();
            }
        } else {
            this.showWarning("Invalid move! Larger disk cannot be placed on smaller one.");
        }
        
        this.deselectDisk();
    }
    
    /**
     * 验证移动是否有效
     */
    isValidMove(fromPeg, toPeg) {
        const fromPegDisks = this.state.pegs[fromPeg];
        const toPegDisks = this.state.pegs[toPeg];
        
        // 如果源柱子为空，移动无效
        if (fromPegDisks.length === 0) return false;
        
        // 如果目标柱子为空，移动有效
        if (toPegDisks.length === 0) return true;
        
        const fromTop = fromPegDisks[fromPegDisks.length - 1];
        const toTop = toPegDisks[toPegDisks.length - 1];
        
        // 只有较小的圆盘可以放在较大的圆盘上
        return fromTop < toTop;
    }
    
    /**
     * 执行移动
     */
    executeMove(fromPeg, toPeg, isAutoMove = false) {
        // 保存到历史记录（用于撤销）
        this.state.moveHistory.push({
            from: fromPeg,
            to: toPeg,
            diskSize: this.state.pegs[fromPeg][this.state.pegs[fromPeg].length - 1]
        });
        
        // 使用数组的 pop 和 push 方法移动圆盘
        const disk = this.state.pegs[fromPeg].pop();
        this.state.pegs[toPeg].push(disk);
        
        // 如果不是自动移动，增加步数
        if (!isAutoMove) {
            this.state.moves++;
        }
        
        // 更新UI
        this.render();
        this.updateUI();
        
        // 如果不是自动移动，添加动画效果
        if (!isAutoMove) {
            const toPegElement = document.querySelectorAll('.peg')[toPeg];
            const movedDisk = toPegElement.querySelector('.disk:last-child');
            if (movedDisk) {
                movedDisk.classList.add('float');
                setTimeout(() => movedDisk.classList.remove('float'), 1000);
            }
        }
    }
    
    /**
     * 撤销上一步移动
     */
    undoMove() {
        if (this.state.isAutoSolving || this.state.isSolved || this.state.moveHistory.length === 0) {
            return;
        }
        
        const lastMove = this.state.moveHistory.pop();
        const disk = this.state.pegs[lastMove.to].pop();
        this.state.pegs[lastMove.from].push(disk);
        
        this.state.moves = Math.max(0, this.state.moves - 1);
        
        this.render();
        this.updateUI();
    }
    
    /**
     * 检查是否获胜
     */
    checkWin() {
        // 检查所有圆盘是否都在柱子C上
        return this.state.pegs[2].length === this.state.disksCount;
    }
    
    /**
     * 显示警告消息
     */
    showWarning(message) {
        this.DOM.warningText.textContent = message;
        this.DOM.warningMessage.classList.add('show', 'shake');
        
        setTimeout(() => {
            this.DOM.warningMessage.classList.remove('shake');
        }, 500);
        
        setTimeout(() => {
            this.DOM.warningMessage.classList.remove('show');
        }, 2000);
    }
    
    /**
     * 显示胜利界面
     */
    showVictory() {
        this.state.isSolved = true;
        
        this.DOM.finalMoves.textContent = this.state.moves;
        this.DOM.finalDisks.textContent = this.state.disksCount;
        this.DOM.optimalMoves.textContent = Math.pow(2, this.state.disksCount) - 1;
        
        this.DOM.victoryModal.classList.add('show');
        
        // 添加庆祝动画
        const pegsContainer = document.querySelector('.pegs-container');
        pegsContainer.classList.add('glow');
    }
    
    /**
     * 隐藏胜利界面
     */
    hideVictoryModal() {
        this.DOM.victoryModal.classList.remove('show');
        const pegsContainer = document.querySelector('.pegs-container');
        pegsContainer.classList.remove('glow');
        
        this.resetGame();
    }
    
    /**
     * 更新UI显示
     */
    updateUI() {
        this.DOM.moveCounter.textContent = this.state.moves;
        
        // 更新按钮状态
        this.DOM.autoSolveBtn.disabled = this.state.isAutoSolving || this.state.isSolved;
        this.DOM.resetBtn.disabled = this.state.isAutoSolving;
        this.DOM.undoBtn.disabled = this.state.isAutoSolving || this.state.moveHistory.length === 0 || this.state.isSolved;
        this.DOM.diskCountInput.disabled = this.state.isAutoSolving;
        this.DOM.diskCountSlider.disabled = this.state.isAutoSolving;
    }
    
    /**
     * 自动求解
     */
    async autoSolve() {
        if (this.state.isAutoSolving) return;
        
        this.state.isAutoSolving = true;
        this.state.isSolved = false;
        this.updateUI();
        
        // 重置游戏
        this.resetGame();
        
        // 使用递归算法解决汉诺塔
        const moveHistory = [];
        this.solveHanoi(this.state.disksCount, 0, 2, 1, moveHistory);
        
        // 逐步执行移动
        for (let i = 0; i < moveHistory.length; i++) {
            if (!this.state.isAutoSolving) break;
            
            const move = moveHistory[i];
            this.executeMove(move.from, move.to, true);
            this.state.moves++;
            
            // 更新移动计数器
            this.DOM.moveCounter.textContent = this.state.moves;
            
            // 延迟，以便观察移动
            await this.sleep(800);
        }
        
        this.state.isAutoSolving = false;
        
        // 检查是否完成
        if (this.checkWin()) {
            this.showVictory();
        } else {
            this.updateUI();
        }
    }
    
    /**
     * 递归解决汉诺塔
     */
    solveHanoi(n, from, to, aux, moveHistory) {
        if (n === 1) {
            moveHistory.push({ from, to });
            return;
        }
        
        this.solveHanoi(n - 1, from, aux, to, moveHistory);
        moveHistory.push({ from, to });
        this.solveHanoi(n - 1, aux, to, from, moveHistory);
    }
    
    /**
     * 睡眠函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 停止自动求解
     */
    stopAutoSolve() {
        this.state.isAutoSolving = false;
        this.updateUI();
    }
}

// 当页面加载完成时初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new HanoiGame();
    
    // 暴露给全局，便于调试
    window.hanoiGame = game;
});