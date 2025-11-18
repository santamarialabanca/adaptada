// Estado global
const state = {
    currentGame: null,
    scores: {
        drag: 0,
        connect: 0,
        match: 0,
        visual: 0,
        letters: 0
    },
    dragState: {
        numbers: [],
        dropZones: [],
        placed: new Set()
    },
    connectState: {
        selected: null,
        connections: new Map(),
        completed: new Set()
    },
    matchState: {
        flipped: [],
        matched: new Set(),
        canFlip: true
    },
    visualState: {
        currentNumber: 1,
        placed: new Set(),
        colors: ['yellow', 'green', 'blue', 'orange', 'pink', 'purple', 'red', 'cyan', 'lime']
    },
    lettersState: {
        vowels: ['A', 'E', 'I', 'O', 'U'],
        consonants: ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'],
        placed: new Set()
    }
};

// Números del 1 al 9
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initDragGame();
    initConnectGame();
    initMatchGame();
    initVisualGame();
    initLettersGame();
});

// Menú Principal
function initMenu() {
    const gameButtons = document.querySelectorAll('.game-button');
    gameButtons.forEach(button => {
        button.addEventListener('click', () => {
            const gameType = button.getAttribute('data-game');
            startGame(gameType);
        });
        
        // Soporte para teclado
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
        });
    });
}

// Cambiar de pantalla
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

// Iniciar juego
function startGame(gameType) {
    state.currentGame = gameType;
    
    switch(gameType) {
        case 'drag':
            showScreen('game-drag');
            resetDragGame();
            break;
        case 'connect':
            showScreen('game-connect');
            resetConnectGame();
            break;
        case 'match':
            showScreen('game-match');
            resetMatchGame();
            break;
        case 'visual':
            showScreen('game-visual');
            resetVisualGame();
            break;
        case 'letters':
            showScreen('game-letters');
            resetLettersGame();
            break;
    }
}

// Botones de volver
document.querySelectorAll('.back-button').forEach(button => {
    button.addEventListener('click', () => {
        showScreen('main-menu');
    });
});

// ========== JUEGO: ARRASTRAR ==========
function initDragGame() {
    const container = document.querySelector('#game-drag .drag-game-container');
    if (!container) return;

    const dropZonesContainer = container.querySelector('.drop-zones');
    const dragItemsContainer = container.querySelector('.drag-items');

    // Crear zonas de destino
    NUMBERS.forEach(num => {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.setAttribute('data-number', num);
        dropZone.setAttribute('aria-label', `Zona para el número ${num}`);
        
        const label = document.createElement('div');
        label.className = 'drop-zone-label';
        label.textContent = num;
        dropZone.appendChild(label);
        
        dropZonesContainer.appendChild(dropZone);
    });

    // Crear números arrastrables (mezclados)
    const shuffled = [...NUMBERS].sort(() => Math.random() - 0.5);
    shuffled.forEach(num => {
        const dragItem = document.createElement('div');
        dragItem.className = 'drag-item';
        dragItem.setAttribute('draggable', 'true');
        dragItem.setAttribute('data-number', num);
        dragItem.setAttribute('aria-label', `Número ${num}`);
        dragItem.textContent = num;
        
        dragItem.addEventListener('dragstart', handleDragStart);
        dragItem.addEventListener('dragend', handleDragEnd);
        
        dragItemsContainer.appendChild(dragItem);
    });

    // Configurar zonas de destino
    dropZonesContainer.querySelectorAll('.drop-zone').forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('drop', handleDrop);
        zone.addEventListener('dragenter', handleDragEnter);
        zone.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    const item = e.target;
    if (item.classList.contains('placed')) {
        e.preventDefault();
        return;
    }
    
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.getAttribute('data-number'));
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    const zone = e.target.closest('.drop-zone');
    if (zone && !zone.classList.contains('filled')) {
        zone.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const zone = e.target.closest('.drop-zone');
    if (zone) {
        zone.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const zone = e.target.closest('.drop-zone');
    if (!zone) return;

    zone.classList.remove('drag-over');
    
    const draggedNumber = e.dataTransfer.getData('text/plain');
    const targetNumber = zone.getAttribute('data-number');
    
    const dragItem = document.querySelector(`.drag-item[data-number="${draggedNumber}"]:not(.placed)`);
    
    if (!dragItem) return;

    if (draggedNumber === targetNumber) {
        // Correcto
        zone.classList.add('filled');
        zone.innerHTML = draggedNumber;
        zone.style.fontSize = '4rem';
        zone.style.fontWeight = 'bold';
        zone.style.color = 'var(--accent-green)';
        
        dragItem.classList.add('placed');
        dragItem.setAttribute('draggable', 'false');
        
        state.dragState.placed.add(parseInt(draggedNumber));
        state.scores.drag = state.dragState.placed.size;
        updateScore('drag', state.scores.drag);
        
        showFeedback('drag-feedback', `¡Correcto! Número ${draggedNumber}`, 'success');
        
        if (state.scores.drag === 9) {
            setTimeout(() => showSuccessModal(), 1000);
        }
    } else {
        // Incorrecto
        showFeedback('drag-feedback', 'Inténtalo de nuevo', 'error');
        zone.classList.add('shake');
        setTimeout(() => zone.classList.remove('shake'), 500);
    }
}

function resetDragGame() {
    state.scores.drag = 0;
    state.dragState.placed.clear();
    updateScore('drag', 0);
    
    const container = document.querySelector('#game-drag .drag-game-container');
    if (!container) return;
    
    const dropZones = container.querySelectorAll('.drop-zone');
    const dragItems = container.querySelectorAll('.drag-item');
    
    dropZones.forEach(zone => {
        zone.classList.remove('filled', 'drag-over');
        const num = zone.getAttribute('data-number');
        zone.innerHTML = `<div class="drop-zone-label">${num}</div>`;
        zone.style.fontSize = '';
        zone.style.fontWeight = '';
        zone.style.color = '';
    });
    
    dragItems.forEach(item => {
        item.classList.remove('placed', 'dragging');
        item.setAttribute('draggable', 'true');
    });
    
    // Mezclar de nuevo
    const itemsArray = Array.from(dragItems);
    itemsArray.sort(() => Math.random() - 0.5);
    const dragContainer = container.querySelector('.drag-items');
    itemsArray.forEach(item => dragContainer.appendChild(item));
    
    clearFeedback('drag-feedback');
}

// ========== JUEGO: UNIR CON LÍNEAS ==========
function initConnectGame() {
    const container = document.querySelector('#game-connect .connect-game-container');
    if (!container) return;

    const leftContainer = container.querySelector('.connect-left');
    const rightContainer = container.querySelector('.connect-right');
    const svg = container.querySelector('#connect-svg');

    // Crear números a la izquierda (ordenados)
    NUMBERS.forEach(num => {
        const item = document.createElement('div');
        item.className = 'connect-item';
        item.setAttribute('data-number', num);
        item.setAttribute('data-side', 'left');
        item.setAttribute('aria-label', `Número ${num}`);
        item.setAttribute('tabindex', '0');
        
        const content = document.createElement('div');
        content.className = 'connect-item-number';
        content.textContent = num;
        item.appendChild(content);
        
        item.addEventListener('click', () => handleConnectClick(item));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleConnectClick(item);
            }
        });
        
        leftContainer.appendChild(item);
    });

    // Crear números a la derecha (mezclados)
    const shuffledNumbers = [...NUMBERS].sort(() => Math.random() - 0.5);
    shuffledNumbers.forEach(num => {
        const item = document.createElement('div');
        item.className = 'connect-item';
        item.setAttribute('data-number', num);
        item.setAttribute('data-side', 'right');
        item.setAttribute('aria-label', `Número ${num}`);
        item.setAttribute('tabindex', '0');
        
        const content = document.createElement('div');
        content.className = 'connect-item-number';
        content.textContent = num;
        item.appendChild(content);
        
        item.addEventListener('click', () => handleConnectClick(item));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleConnectClick(item);
            }
        });
        
        rightContainer.appendChild(item);
    });

    // Configurar SVG
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
}

function handleConnectClick(item) {
    if (item.classList.contains('connected')) return;

    const side = item.getAttribute('data-side');
    const number = parseInt(item.getAttribute('data-number'));

    if (state.connectState.selected === null) {
        // Primera selección - puede ser de cualquier lado
        state.connectState.selected = { element: item, number, side };
        item.classList.add('selected');
    } else {
        // Segunda selección
        const selectedSide = state.connectState.selected.side;
        
        // Solo permitir conectar si son de lados diferentes
        if (side !== selectedSide) {
            // Verificar si es correcto (mismo número)
            if (state.connectState.selected.number === number) {
                // Correcto
                drawConnection(state.connectState.selected.element, item, true);
                state.connectState.selected.element.classList.add('connected');
                item.classList.add('connected');
                state.connectState.selected.element.classList.remove('selected');
                
                state.connectState.completed.add(number);
                state.scores.connect = state.connectState.completed.size;
                updateScore('connect', state.scores.connect);
                
                showFeedback('connect-feedback', `¡Correcto! Número ${number}`, 'success');
                
                if (state.scores.connect === 9) {
                    setTimeout(() => showSuccessModal(), 1000);
                }
            } else {
                // Incorrecto
                drawConnection(state.connectState.selected.element, item, false);
                setTimeout(() => {
                    const svg = document.querySelector('#connect-svg');
                    const lastLine = svg.querySelector('.connection-line:last-child');
                    if (lastLine) lastLine.remove();
                }, 1000);
                
                showFeedback('connect-feedback', 'Inténtalo de nuevo', 'error');
            }
            
            state.connectState.selected.element.classList.remove('selected');
            state.connectState.selected = null;
        } else {
            // Mismo lado - cambiar selección
            state.connectState.selected.element.classList.remove('selected');
            state.connectState.selected = { element: item, number, side };
            item.classList.add('selected');
        }
    }
}

function drawConnection(leftItem, rightItem, isCorrect) {
    const svg = document.querySelector('#connect-svg');
    const leftRect = leftItem.getBoundingClientRect();
    const rightRect = rightItem.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    const x1 = leftRect.right - svgRect.left;
    const y1 = leftRect.top + leftRect.height / 2 - svgRect.top;
    const x2 = rightRect.left - svgRect.left;
    const y2 = rightRect.top + rightRect.height / 2 - svgRect.top;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.classList.add('connection-line');
    line.classList.add(isCorrect ? 'correct' : 'incorrect');

    svg.appendChild(line);
}

function resetConnectGame() {
    state.scores.connect = 0;
    state.connectState.selected = null;
    state.connectState.completed.clear();
    state.connectState.connections.clear();
    updateScore('connect', 0);
    
    const container = document.querySelector('#game-connect .connect-game-container');
    if (!container) return;
    
    const items = container.querySelectorAll('.connect-item');
    items.forEach(item => {
        item.classList.remove('selected', 'connected');
    });
    
    const svg = container.querySelector('#connect-svg');
    svg.innerHTML = '';
    
    // Limpiar contenedores
    const leftContainer = container.querySelector('.connect-left');
    const rightContainer = container.querySelector('.connect-right');
    leftContainer.innerHTML = '';
    rightContainer.innerHTML = '';
    
    // Recrear el juego
    initConnectGame();
    
    clearFeedback('connect-feedback');
}

// ========== JUEGO: EMPAREJAR ==========
function initMatchGame() {
    const container = document.querySelector('#game-match .match-game-container');
    if (!container) return;

    // Crear pares de tarjetas
    const cards = [];
    NUMBERS.forEach(num => {
        // Dos tarjetas por número
        for (let i = 0; i < 2; i++) {
            cards.push(num);
        }
    });

    // Mezclar
    cards.sort(() => Math.random() - 0.5);

    // Crear tarjetas
    cards.forEach((num, index) => {
        const card = document.createElement('div');
        card.className = 'match-card';
        card.setAttribute('data-number', num);
        card.setAttribute('data-index', index);
        card.setAttribute('aria-label', `Tarjeta ${index + 1}`);
        card.setAttribute('tabindex', '0');
        
        const content = document.createElement('div');
        content.className = 'match-card-content';
        content.textContent = num;
        card.appendChild(content);
        
        card.addEventListener('click', () => handleMatchClick(card));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleMatchClick(card);
            }
        });
        
        container.appendChild(card);
    });
}

function handleMatchClick(card) {
    if (!state.matchState.canFlip) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    state.matchState.flipped.push(card);

    if (state.matchState.flipped.length === 2) {
        state.matchState.canFlip = false;
        
        const [card1, card2] = state.matchState.flipped;
        const num1 = parseInt(card1.getAttribute('data-number'));
        const num2 = parseInt(card2.getAttribute('data-number'));

        setTimeout(() => {
            if (num1 === num2) {
                // Pareja encontrada
                card1.classList.add('matched');
                card2.classList.add('matched');
                state.matchState.matched.add(num1);
                state.scores.match = state.matchState.matched.size;
                updateScore('match', state.scores.match);
                
                showFeedback('match-feedback', `¡Pareja encontrada! Número ${num1}`, 'success');
                
                if (state.scores.match === 9) {
                    setTimeout(() => showSuccessModal(), 1000);
                }
            } else {
                // No es pareja
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                showFeedback('match-feedback', 'Inténtalo de nuevo', 'error');
            }
            
            state.matchState.flipped = [];
            state.matchState.canFlip = true;
        }, 1000);
    }
}

function resetMatchGame() {
    state.scores.match = 0;
    state.matchState.flipped = [];
    state.matchState.matched.clear();
    state.matchState.canFlip = true;
    updateScore('match', 0);
    
    const container = document.querySelector('#game-match .match-game-container');
    if (!container) return;
    
    const cards = Array.from(container.children);
    cards.forEach(card => {
        card.classList.remove('flipped', 'matched');
    });
    
    // Mezclar de nuevo
    cards.sort(() => Math.random() - 0.5);
    cards.forEach(card => container.appendChild(card));
    
    clearFeedback('match-feedback');
}

// ========== FUNCIONES AUXILIARES ==========
function updateScore(gameType, score) {
    const scoreElement = document.getElementById(`${gameType}-score`);
    if (scoreElement) {
        scoreElement.textContent = score;
    }
}

function showFeedback(elementId, message, type) {
    const feedback = document.getElementById(elementId);
    if (!feedback) return;
    
    feedback.textContent = message;
    feedback.className = `feedback-message ${type}`;
    
    setTimeout(() => {
        feedback.classList.add('show');
    }, 10);
}

function clearFeedback(elementId) {
    const feedback = document.getElementById(elementId);
    if (feedback) {
        feedback.textContent = '';
        feedback.className = 'feedback-message';
    }
}

function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Botones del modal
document.getElementById('play-again')?.addEventListener('click', () => {
    const modal = document.getElementById('success-modal');
    if (modal) modal.classList.remove('active');
    
    if (state.currentGame) {
        switch(state.currentGame) {
            case 'drag':
                resetDragGame();
                break;
            case 'connect':
                resetConnectGame();
                break;
            case 'match':
                resetMatchGame();
                break;
            case 'visual':
                resetVisualGame();
                break;
        }
    }
});

document.getElementById('back-to-menu')?.addEventListener('click', () => {
    const modal = document.getElementById('success-modal');
    if (modal) modal.classList.remove('active');
    showScreen('main-menu');
});

// ========== JUEGO: VISUAL CON PUNTOS DE COLORES ==========
function initVisualGame() {
    const container = document.querySelector('#game-visual .visual-game-container');
    if (!container) return;

    const bigNumberDisplay = container.querySelector('.big-number');
    const dotsContainer = container.querySelector('#visual-dots');
    const cardsContainer = container.querySelector('#visual-cards');

    // Mostrar número grande
    if (bigNumberDisplay) {
        bigNumberDisplay.textContent = state.visualState.currentNumber;
    }

    // Crear línea de referencia visual de colores (6-8 círculos)
    dotsContainer.innerHTML = '';
    const colors = state.visualState.colors;
    const referenceDotsCount = Math.min(8, Math.max(6, state.visualState.currentNumber + 2));
    
    // Crear línea de referencia visual
    const referenceLine = document.createElement('div');
    referenceLine.className = 'visual-reference-line';
    referenceLine.style.display = 'flex';
    referenceLine.style.justifyContent = 'center';
    referenceLine.style.alignItems = 'center';
    referenceLine.style.gap = '15px';
    referenceLine.style.flexWrap = 'wrap';
    referenceLine.style.marginBottom = '30px';
    referenceLine.setAttribute('aria-label', 'Línea de referencia de colores');
    
    for (let i = 0; i < referenceDotsCount; i++) {
        const refDot = document.createElement('div');
        refDot.className = 'visual-reference-dot';
        refDot.style.backgroundColor = getColorValue(colors[i % colors.length]);
        refDot.setAttribute('aria-label', `Color de referencia ${i + 1}`);
        referenceLine.appendChild(refDot);
    }
    
    dotsContainer.appendChild(referenceLine);
    
    // Crear zona de ordenamiento debajo
    const orderingZone = document.createElement('div');
    orderingZone.className = 'visual-ordering-zone';
    orderingZone.style.display = 'flex';
    orderingZone.style.justifyContent = 'center';
    orderingZone.style.alignItems = 'center';
    orderingZone.style.gap = '15px';
    orderingZone.style.flexWrap = 'wrap';
    orderingZone.style.minHeight = '150px';
    orderingZone.style.padding = '20px';
    orderingZone.style.background = 'var(--bg-card)';
    orderingZone.style.border = '3px dashed var(--accent-blue)';
    orderingZone.style.borderRadius = '15px';
    orderingZone.setAttribute('id', 'visual-ordering-zone');
    
    // Crear slots para ordenar (según el número actual)
    for (let i = 0; i < state.visualState.currentNumber; i++) {
        const slot = document.createElement('div');
        slot.className = 'visual-ordering-slot';
        slot.setAttribute('data-number', state.visualState.currentNumber);
        slot.setAttribute('data-index', i);
        slot.setAttribute('aria-label', `Slot ${i + 1}`);
        
        slot.addEventListener('dragover', handleVisualDragOver);
        slot.addEventListener('drop', handleVisualDrop);
        slot.addEventListener('dragenter', handleVisualDragEnter);
        slot.addEventListener('dragleave', handleVisualDragLeave);
        
        orderingZone.appendChild(slot);
    }
    
    dotsContainer.appendChild(orderingZone);

    // Crear elementos para ordenar (números o objetos según el número actual)
    cardsContainer.innerHTML = '';
    
    // Crear elementos ordenables según el número actual
    const itemsToOrder = [];
    for (let i = 1; i <= state.visualState.currentNumber; i++) {
        itemsToOrder.push(i);
    }
    
    // Mezclar para que el niño tenga que ordenarlos
    itemsToOrder.sort(() => Math.random() - 0.5);
    
    itemsToOrder.forEach((num, index) => {
        const card = document.createElement('div');
        card.className = 'visual-card';
        card.setAttribute('draggable', 'true');
        card.setAttribute('data-number', num);
        card.setAttribute('data-order', num);
        card.setAttribute('aria-label', `Elemento ${num}`);
        
        // Contenido de la tarjeta: número grande o icono
        const cardContent = document.createElement('div');
        cardContent.className = 'visual-card-content';
        
        // Mostrar número grande
        const numberDisplay = document.createElement('div');
        numberDisplay.className = 'visual-card-number';
        numberDisplay.textContent = num;
        numberDisplay.style.fontSize = '3rem';
        numberDisplay.style.fontWeight = 'bold';
        numberDisplay.style.color = 'var(--bg-dark)';
        cardContent.appendChild(numberDisplay);
        
        // Puntos de color que coinciden con la referencia
        const cardDots = document.createElement('div');
        cardDots.className = 'visual-card-dots';
        for (let i = 0; i < num; i++) {
            const dot = document.createElement('div');
            dot.className = 'visual-card-dot';
            dot.style.backgroundColor = getColorValue(colors[i % colors.length]);
            cardDots.appendChild(dot);
        }
        cardContent.appendChild(cardDots);
        
        card.appendChild(cardContent);
        
        // Eventos de arrastre
        card.addEventListener('dragstart', handleVisualDragStart);
        card.addEventListener('dragend', handleVisualDragEnd);
        
        cardsContainer.appendChild(card);
    });
}

function getColorValue(colorName) {
    const colors = {
        yellow: '#ffd700',
        green: '#00ff88',
        blue: '#00bfff',
        orange: '#ff8c00',
        pink: '#ff69b4',
        purple: '#9370db',
        red: '#ff4444',
        cyan: '#00ffff',
        lime: '#32cd32'
    };
    return colors[colorName] || colors.yellow;
}

function getObjectIcon(num) {
    const icons = [
        '<i class="fas fa-apple-alt"></i>',      // 1
        '<i class="fas fa-car"></i>',            // 2
        '<i class="fas fa-cat"></i>',            // 3
        '<i class="fas fa-dog"></i>',            // 4
        '<i class="fas fa-star"></i>',           // 5
        '<i class="fas fa-heart"></i>',         // 6
        '<i class="fas fa-birthday-cake"></i>', // 7
        '<i class="fas fa-sun"></i>',           // 8
        '<i class="fas fa-moon"></i>'            // 9
    ];
    return icons[num - 1] || '<i class="fas fa-circle"></i>';
}

function handleVisualDragStart(e) {
    const card = e.target.closest('.visual-card');
    if (!card || card.classList.contains('placed')) {
        e.preventDefault();
        return;
    }
    
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.getAttribute('data-order'));
}

function handleVisualDragEnd(e) {
    const card = e.target.closest('.visual-card');
    if (card) {
        card.classList.remove('dragging');
    }
}

function handleVisualDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleVisualDragEnter(e) {
    e.preventDefault();
    const zone = e.target.closest('.visual-ordering-slot');
    if (zone && !zone.classList.contains('filled')) {
        zone.classList.add('drag-over');
    }
}

function handleVisualDragLeave(e) {
    const zone = e.target.closest('.visual-ordering-slot');
    if (zone) {
        zone.classList.remove('drag-over');
    }
}

function handleVisualDrop(e) {
    e.preventDefault();
    const zone = e.target.closest('.visual-ordering-slot');
    if (!zone) return;

    zone.classList.remove('drag-over');
    
    const draggedOrder = parseInt(e.dataTransfer.getData('text/plain'));
    const slotIndex = parseInt(zone.getAttribute('data-index'));
    const expectedOrder = slotIndex + 1; // Los slots van de 1 a N
    
    const card = document.querySelector(`.visual-card[data-order="${draggedOrder}"]:not(.placed)`);
    
    if (!card) return;

    if (draggedOrder === expectedOrder) {
        // Correcto - orden correcto
        zone.classList.add('filled');
        const cardClone = card.cloneNode(true);
        cardClone.classList.remove('dragging');
        cardClone.classList.add('placed-card');
        cardClone.setAttribute('draggable', 'false');
        zone.appendChild(cardClone);
        
        card.classList.add('placed');
        card.setAttribute('draggable', 'false');
        
        state.visualState.placed.add(draggedOrder);
        state.scores.visual = state.visualState.placed.size;
        updateScore('visual', state.scores.visual);
        
        showFeedback('visual-feedback', `¡Correcto! Orden ${draggedOrder}`, 'success');
        
        // Avanzar al siguiente número cuando se complete el orden
        if (state.scores.visual === state.visualState.currentNumber) {
            setTimeout(() => {
                if (state.visualState.currentNumber < 9) {
                    state.visualState.currentNumber++;
                    state.visualState.placed.clear();
                    state.scores.visual = 0;
                    updateScore('visual', 0);
                    initVisualGame();
                    showFeedback('visual-feedback', `¡Siguiente número: ${state.visualState.currentNumber}!`, 'success');
                } else {
                    setTimeout(() => showSuccessModal(), 1000);
                }
            }, 1500);
        }
    } else {
        // Incorrecto
        showFeedback('visual-feedback', 'Inténtalo de nuevo', 'error');
        zone.classList.add('shake');
        setTimeout(() => zone.classList.remove('shake'), 500);
    }
}

function resetVisualGame() {
    state.visualState.currentNumber = 1;
    state.visualState.placed.clear();
    state.scores.visual = 0;
    updateScore('visual', 0);
    
    const container = document.querySelector('#game-visual .visual-game-container');
    if (!container) return;
    
    const dotsContainer = container.querySelector('#visual-dots');
    const cardsContainer = container.querySelector('#visual-cards');
    
    // Limpiar contenedores
    dotsContainer.innerHTML = '';
    cardsContainer.innerHTML = '';
    
    // Recrear el juego
    initVisualGame();
    
    clearFeedback('visual-feedback');
}

// ========== JUEGO: VOCALES Y CONSONANTES ==========
function initLettersGame() {
    const container = document.querySelector('#game-letters');
    if (!container) return;

    const itemsContainer = container.querySelector('#letters-items');
    const vowelZone = container.querySelector('#vowel-zone');
    const consonantZone = container.querySelector('#consonant-zone');

    // Mezclar todas las letras
    const allLetters = [...state.lettersState.vowels, ...state.lettersState.consonants];
    const shuffledLetters = [...allLetters].sort(() => Math.random() - 0.5);

    // Crear letras arrastrables
    itemsContainer.innerHTML = '';
    shuffledLetters.forEach(letter => {
        const letterItem = document.createElement('div');
        letterItem.className = 'letter-item';
        letterItem.setAttribute('draggable', 'true');
        letterItem.setAttribute('data-letter', letter);
        letterItem.setAttribute('aria-label', `Letra ${letter}`);
        
        const isVowel = state.lettersState.vowels.includes(letter);
        letterItem.style.backgroundColor = isVowel ? '#ff4444' : '#00bfff';
        letterItem.style.color = '#ffffff';
        letterItem.style.border = '4px solid #ffffff';
        
        letterItem.textContent = letter;
        letterItem.style.fontSize = '3rem';
        letterItem.style.fontWeight = 'bold';
        
        letterItem.addEventListener('dragstart', handleLetterDragStart);
        letterItem.addEventListener('dragend', handleLetterDragEnd);
        
        itemsContainer.appendChild(letterItem);
    });

    // Configurar zonas de drop
    [vowelZone, consonantZone].forEach(zone => {
        zone.addEventListener('dragover', handleLetterDragOver);
        zone.addEventListener('drop', handleLetterDrop);
        zone.addEventListener('dragenter', handleLetterDragEnter);
        zone.addEventListener('dragleave', handleLetterDragLeave);
    });
}

function handleLetterDragStart(e) {
    const item = e.target.closest('.letter-item');
    if (!item || item.classList.contains('placed')) {
        e.preventDefault();
        return;
    }
    
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.getAttribute('data-letter'));
}

function handleLetterDragEnd(e) {
    const item = e.target.closest('.letter-item');
    if (item) {
        item.classList.remove('dragging');
    }
}

function handleLetterDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleLetterDragEnter(e) {
    e.preventDefault();
    const zone = e.target.closest('.letters-drop-zone');
    if (zone) {
        zone.classList.add('drag-over');
    }
}

function handleLetterDragLeave(e) {
    const zone = e.target.closest('.letters-drop-zone');
    if (zone) {
        zone.classList.remove('drag-over');
    }
}

function handleLetterDrop(e) {
    e.preventDefault();
    const zone = e.target.closest('.letters-drop-zone');
    if (!zone) return;

    zone.classList.remove('drag-over');
    
    const letter = e.dataTransfer.getData('text/plain');
    const isVowel = state.lettersState.vowels.includes(letter);
    const isVowelZone = zone.classList.contains('vowel-zone');
    
    const letterItem = document.querySelector(`.letter-item[data-letter="${letter}"]:not(.placed)`);
    
    if (!letterItem) return;

    if ((isVowel && isVowelZone) || (!isVowel && !isVowelZone)) {
        // Correcto
        const letterClone = letterItem.cloneNode(true);
        letterClone.classList.remove('dragging');
        letterClone.classList.add('placed-letter');
        letterClone.setAttribute('draggable', 'false');
        letterClone.style.fontSize = '2.5rem';
        zone.appendChild(letterClone);
        
        letterItem.classList.add('placed');
        letterItem.setAttribute('draggable', 'false');
        letterItem.style.opacity = '0.3';
        
        state.lettersState.placed.add(letter);
        state.scores.letters = state.lettersState.placed.size;
        updateScore('letters', state.scores.letters);
        
        const type = isVowel ? 'vocal' : 'consonante';
        showFeedback('letters-feedback', `¡Correcto! La ${letter} es una ${type}`, 'success');
        
        const allLetters = [...state.lettersState.vowels, ...state.lettersState.consonants];
        if (state.scores.letters === allLetters.length) {
            setTimeout(() => showSuccessModal(), 1000);
        }
    } else {
        // Incorrecto
        showFeedback('letters-feedback', 'Inténtalo de nuevo', 'error');
        zone.classList.add('shake');
        setTimeout(() => zone.classList.remove('shake'), 500);
    }
}

function resetLettersGame() {
    state.lettersState.placed.clear();
    state.scores.letters = 0;
    updateScore('letters', 0);
    
    const container = document.querySelector('#game-letters');
    if (!container) return;
    
    const itemsContainer = container.querySelector('#letters-items');
    const vowelZone = container.querySelector('#vowel-zone');
    const consonantZone = container.querySelector('#consonant-zone');
    
    // Limpiar zonas
    vowelZone.innerHTML = '';
    consonantZone.innerHTML = '';
    
    // Recrear el juego
    initLettersGame();
    
    clearFeedback('letters-feedback');
}

// Prevenir comportamiento por defecto en drag
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
});

