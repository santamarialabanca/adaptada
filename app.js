// Estado global
const state = {
    currentGame: null,
    scores: {
        drag: 0,
        connect: 0,
        match: 0,
        visual: 0,
        letters: 0,
        wheel: 0,
        sheep: 0,
        boxes: 0,
        flashcards: 0,
        reorder: 0,
        quiz: 0,
        group: 0,
        complete: 0,
        cards: 0
    },
    dragState: {
        numbers: [],
        dropZones: [],
        placed: new Set()
    },
    connectState: {
        selected: null,
        connections: new Map(),
        completed: new Set(),
        drawing: false,
        startElement: null,
        currentLine: null
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
    },
    wheelState: {
        currentRotation: 0,
        isSpinning: false,
        targetNumber: 1,
        found: new Set()
    },
    sheepState: {
        currentQuestion: null,
        answers: [],
        correctAnswer: null,
        completed: new Set()
    },
    boxesState: {
        opened: new Set(),
        numbers: []
    },
    flashcardsState: {
        currentIndex: 0,
        cards: [],
        flipped: false,
        completed: new Set()
    },
    reorderState: {
        items: [],
        slots: [],
        correctOrder: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        placed: new Map()
    },
    quizState: {
        currentQuestion: null,
        currentAnswer: null,
        completed: new Set()
    },
    groupState: {
        groups: [
            { name: 'Pequeños', numbers: [1, 2, 3], color: 'blue' },
            { name: 'Medianos', numbers: [4, 5, 6], color: 'green' },
            { name: 'Grandes', numbers: [7, 8, 9], color: 'orange' }
        ],
        placed: new Map()
    },
    completeState: {
        currentSentence: null,
        blanks: [],
        completed: new Set()
    },
    cardsState: {
        deck: [],
        drawn: [],
        targetNumber: 1,
        found: new Set()
    },
    touchState: {
        activeTouch: null,
        draggedElement: null,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0
    }
};

// Números del 1 al 9
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// ========== UTILIDADES TÁCTILES PARA IPAD ==========
// Sistema mejorado de arrastre táctil para iPad
let activeTouchDrag = {
    element: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    callbacks: null
};

function addTouchSupport(element, onDragStart, onDrag, onDragEnd, onDrop) {
    // Guardar callbacks en el elemento para acceso global
    element._touchCallbacks = { onDragStart, onDrag, onDragEnd, onDrop };
    
    element.addEventListener('touchstart', (e) => {
        // Solo procesar si no hay otro arrastre activo
        if (activeTouchDrag.element && activeTouchDrag.element !== element) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const touch = e.touches[0];
        const rect = element.getBoundingClientRect();
        
        activeTouchDrag.element = element;
        activeTouchDrag.startX = touch.clientX;
        activeTouchDrag.startY = touch.clientY;
        activeTouchDrag.currentX = touch.clientX;
        activeTouchDrag.currentY = touch.clientY;
        activeTouchDrag.isDragging = false;
        activeTouchDrag.callbacks = element._touchCallbacks;
        
        // Guardar posición inicial del elemento
        element._startRect = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        };
        
        if (onDragStart) {
            onDragStart(e, touch);
        }
    }, { passive: false });
    
    element.addEventListener('touchmove', (e) => {
        if (activeTouchDrag.element !== element) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - activeTouchDrag.startX;
        const deltaY = touch.clientY - activeTouchDrag.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        activeTouchDrag.currentX = touch.clientX;
        activeTouchDrag.currentY = touch.clientY;
        
        // Si se mueve más de 15px, considerar que está arrastrando
        if (distance > 15 && !activeTouchDrag.isDragging) {
            activeTouchDrag.isDragging = true;
            document.body.classList.add('dragging-active');
            element.style.transition = 'none';
            element.style.zIndex = '10000';
            element.style.position = 'fixed';
            element.style.left = activeTouchDrag.startX - element._startRect.width / 2 + 'px';
            element.style.top = activeTouchDrag.startY - element._startRect.height / 2 + 'px';
            element.classList.add('dragging');
            
            if (onDrag) {
                onDrag(e, touch, deltaX, deltaY);
            }
        } else if (activeTouchDrag.isDragging && onDrag) {
            // Actualizar posición durante el arrastre
            element.style.left = touch.clientX - element._startRect.width / 2 + 'px';
            element.style.top = touch.clientY - element._startRect.height / 2 + 'px';
            onDrag(e, touch, deltaX, deltaY);
        }
    }, { passive: false });
    
    element.addEventListener('touchend', (e) => {
        if (activeTouchDrag.element !== element) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const touch = e.changedTouches[0];
        
        if (activeTouchDrag.isDragging) {
            // Ocultar temporalmente el elemento para detectar qué hay debajo
            const originalDisplay = element.style.display;
            const originalOpacity = element.style.opacity;
            element.style.display = 'none';
            
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            
            element.style.display = originalDisplay;
            element.style.opacity = originalOpacity;
            
            if (onDrop && elementBelow) {
                onDrop(e, touch, elementBelow);
            }
            
            if (onDragEnd) {
                onDragEnd(e, touch);
            }
        } else {
            // Si no se arrastró, podría ser un click simple
            // No hacer nada aquí para evitar conflictos
        }
        
        // Resetear estilos
        resetTouchDrag(element);
    }, { passive: false });
    
    element.addEventListener('touchcancel', (e) => {
        if (activeTouchDrag.element === element) {
            resetTouchDrag(element);
        }
    }, { passive: false });
}

function resetTouchDrag(element) {
    if (activeTouchDrag.element === element) {
        document.body.classList.remove('dragging-active');
        element.style.transition = '';
        element.style.zIndex = '';
        element.style.position = '';
        element.style.left = '';
        element.style.top = '';
        element.style.transform = '';
        element.style.opacity = '';
        element.style.display = '';
        element.classList.remove('dragging');
        
        activeTouchDrag.element = null;
        activeTouchDrag.isDragging = false;
        activeTouchDrag.callbacks = null;
    }
}

function getElementAtPoint(x, y) {
    // Ocultar temporalmente todos los elementos arrastrados
    const draggingElements = document.querySelectorAll('.dragging');
    const originalDisplays = [];
    
    draggingElements.forEach(el => {
        originalDisplays.push(el.style.display);
        el.style.display = 'none';
    });
    
    const element = document.elementFromPoint(x, y);
    
    // Restaurar displays
    draggingElements.forEach((el, index) => {
        el.style.display = originalDisplays[index];
    });
    
    return element;
}

// Prevenir scroll durante el arrastre
document.addEventListener('touchmove', (e) => {
    if (activeTouchDrag.isDragging) {
        e.preventDefault();
    }
}, { passive: false });

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initDragGame();
    initConnectGame();
    initMatchGame();
    initVisualGame();
    initLettersGame();
    initWheelGame();
    initSheepGame();
    initBoxesGame();
    initFlashcardsGame();
    initReorderGame();
    initQuizGame();
    initGroupGame();
    initCompleteGame();
    initCardsGame();
    setupGlobalTouchListeners();
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
        case 'wheel':
            showScreen('game-wheel');
            resetWheelGame();
            break;
        case 'sheep':
            showScreen('game-sheep');
            resetSheepGame();
            break;
        case 'boxes':
            showScreen('game-boxes');
            resetBoxesGame();
            break;
        case 'flashcards':
            showScreen('game-flashcards');
            resetFlashcardsGame();
            break;
        case 'reorder':
            showScreen('game-reorder');
            resetReorderGame();
            break;
        case 'quiz':
            showScreen('game-quiz');
            resetQuizGame();
            break;
        case 'group':
            showScreen('game-group');
            resetGroupGame();
            break;
        case 'complete':
            showScreen('game-complete');
            resetCompleteGame();
            break;
        case 'cards':
            showScreen('game-cards');
            resetCardsGame();
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
        
        // Soporte táctil para iPad
        addTouchSupport(
            dragItem,
            (e, touch) => {
                // Touch start
                const item = e.target.closest('.drag-item');
                if (item && item.classList.contains('placed')) {
                    e.preventDefault();
                    return;
                }
            },
            (e, touch, deltaX, deltaY) => {
                // Touch move - arrastrar elemento
                const item = activeTouchDrag.element;
                if (item) {
                    // Verificar si está sobre una zona de drop
                    const elementBelow = getElementAtPoint(touch.clientX, touch.clientY);
                    const dropZone = elementBelow?.closest('.drop-zone');
                    document.querySelectorAll('.drop-zone').forEach(zone => {
                        zone.classList.remove('drag-over');
                    });
                    if (dropZone && !dropZone.classList.contains('filled')) {
                        dropZone.classList.add('drag-over');
                    }
                }
            },
            (e, touch) => {
                // Touch end - resetear (ya se hace en resetTouchDrag)
            },
            (e, touch, elementBelow) => {
                // Drop
                const item = activeTouchDrag.element;
                if (!item || item.classList.contains('placed')) return;
                
                const dropZone = elementBelow?.closest('.drop-zone');
                if (dropZone) {
                    const draggedNumber = item.getAttribute('data-number');
                    const targetNumber = dropZone.getAttribute('data-number');
                    
                    if (draggedNumber === targetNumber) {
                        // Correcto
                        dropZone.classList.add('filled');
                        dropZone.innerHTML = draggedNumber;
                        dropZone.style.fontSize = '4rem';
                        dropZone.style.fontWeight = 'bold';
                        dropZone.style.color = 'var(--accent-green)';
                        
                        item.classList.add('placed');
                        item.setAttribute('draggable', 'false');
                        item.style.display = 'none';
                        
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
                        dropZone.classList.add('shake');
                        setTimeout(() => dropZone.classList.remove('shake'), 500);
                    }
                    
                    dropZone.classList.remove('drag-over');
                }
            }
        );
        
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
        
        // Soporte táctil para dibujar líneas
        addTouchSupportForConnect(item, leftContainer, rightContainer);
        
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
        
        // Soporte táctil para dibujar líneas
        addTouchSupportForConnect(item, leftContainer, rightContainer);
        
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

function addTouchSupportForConnect(item, leftContainer, rightContainer) {
    const svg = document.querySelector('#connect-svg');
    
    item.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (item.classList.contains('connected')) return;
        if (state.connectState.drawing) return; // Ya hay un dibujo en curso
        
        const touch = e.touches[0];
        state.connectState.drawing = true;
        state.connectState.startElement = item;
        
        // Resaltar elemento inicial
        item.classList.add('selected');
        
        // Crear línea temporal para dibujar
        const rect = item.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        const startX = rect.left + rect.width / 2 - svgRect.left;
        const startY = rect.top + rect.height / 2 - svgRect.top;
        
        state.connectState.currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        state.connectState.currentLine.setAttribute('x1', startX);
        state.connectState.currentLine.setAttribute('y1', startY);
        state.connectState.currentLine.setAttribute('x2', startX);
        state.connectState.currentLine.setAttribute('y2', startY);
        state.connectState.currentLine.classList.add('connection-line');
        state.connectState.currentLine.classList.add('drawing');
        state.connectState.currentLine.style.stroke = '#ffd700';
        state.connectState.currentLine.style.strokeWidth = '4';
        svg.appendChild(state.connectState.currentLine);
    }, { passive: false });
}

// Event listeners globales para el dibujo táctil (una sola vez)
let touchMoveListenerAdded = false;
let touchEndListenerAdded = false;

function setupGlobalTouchListeners() {
    if (touchMoveListenerAdded && touchEndListenerAdded) return;
    
    document.addEventListener('touchmove', (e) => {
        if (!state.connectState.drawing || !state.connectState.currentLine) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const svg = document.querySelector('#connect-svg');
        if (!svg) return;
        
        const svgRect = svg.getBoundingClientRect();
        const currentX = touch.clientX - svgRect.left;
        const currentY = touch.clientY - svgRect.top;
        
        // Actualizar línea mientras se dibuja
        const startX = parseFloat(state.connectState.currentLine.getAttribute('x1'));
        const startY = parseFloat(state.connectState.currentLine.getAttribute('y1'));
        state.connectState.currentLine.setAttribute('x2', currentX);
        state.connectState.currentLine.setAttribute('y2', currentY);
    }, { passive: false });
    touchMoveListenerAdded = true;
    
    document.addEventListener('touchend', (e) => {
        if (!state.connectState.drawing || !state.connectState.startElement) return;
        e.preventDefault();
        
        const touch = e.changedTouches[0];
        const elementBelow = getElementAtPoint(touch.clientX, touch.clientY);
        const endElement = elementBelow?.closest('.connect-item');
        
        // Eliminar línea temporal de dibujo
        if (state.connectState.currentLine) {
            state.connectState.currentLine.remove();
            state.connectState.currentLine = null;
        }
        
        const startElement = state.connectState.startElement;
        
        if (endElement && endElement !== startElement && !endElement.classList.contains('connected')) {
            const startSide = startElement.getAttribute('data-side');
            const endSide = endElement.getAttribute('data-side');
            const startNumber = parseInt(startElement.getAttribute('data-number'));
            const endNumber = parseInt(endElement.getAttribute('data-number'));
            
            // Solo permitir conectar si son de lados diferentes
            if (startSide !== endSide) {
                if (startNumber === endNumber) {
                    // Correcto
                    drawConnection(startElement, endElement, true);
                    startElement.classList.add('connected');
                    endElement.classList.add('connected');
                    
                    state.connectState.completed.add(startNumber);
                    state.scores.connect = state.connectState.completed.size;
                    updateScore('connect', state.scores.connect);
                    
                    showFeedback('connect-feedback', `¡Correcto! Número ${startNumber}`, 'success');
                    
                    if (state.scores.connect === 9) {
                        setTimeout(() => showSuccessModal(), 1000);
                    }
                } else {
                    // Incorrecto
                    drawConnection(startElement, endElement, false);
                    setTimeout(() => {
                        const svg = document.querySelector('#connect-svg');
                        const lastLine = svg.querySelector('.connection-line:last-child');
                        if (lastLine) lastLine.remove();
                    }, 1000);
                    
                    showFeedback('connect-feedback', 'Inténtalo de nuevo', 'error');
                }
            }
        }
        
        startElement.classList.remove('selected');
        state.connectState.drawing = false;
        state.connectState.startElement = null;
    }, { passive: false });
    touchEndListenerAdded = true;
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
    state.connectState.drawing = false;
    state.connectState.startElement = null;
    if (state.connectState.currentLine) {
        state.connectState.currentLine.remove();
        state.connectState.currentLine = null;
    }
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
            case 'letters':
                resetLettersGame();
                break;
            case 'wheel':
                resetWheelGame();
                break;
            case 'sheep':
                resetSheepGame();
                break;
            case 'boxes':
                resetBoxesGame();
                break;
            case 'flashcards':
                resetFlashcardsGame();
                break;
            case 'reorder':
                resetReorderGame();
                break;
            case 'quiz':
                resetQuizGame();
                break;
            case 'group':
                resetGroupGame();
                break;
            case 'complete':
                resetCompleteGame();
                break;
            case 'cards':
                resetCardsGame();
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
        
        // Soporte táctil para iPad
        addTouchSupport(
            card,
            (e, touch) => {
                const item = e.target.closest('.visual-card');
                if (item && item.classList.contains('placed')) {
                    e.preventDefault();
                    return;
                }
            },
            (e, touch, deltaX, deltaY) => {
                const item = activeTouchDrag.element;
                if (item) {
                    const elementBelow = getElementAtPoint(touch.clientX, touch.clientY);
                    const slot = elementBelow?.closest('.visual-ordering-slot');
                    document.querySelectorAll('.visual-ordering-slot').forEach(s => {
                        s.classList.remove('drag-over');
                    });
                    if (slot && !slot.classList.contains('filled')) {
                        slot.classList.add('drag-over');
                    }
                }
            },
            (e, touch) => {
                // Ya se resetea en resetTouchDrag
            },
            (e, touch, elementBelow) => {
                const item = activeTouchDrag.element;
                if (!item || item.classList.contains('placed')) return;
                
                const slot = elementBelow?.closest('.visual-ordering-slot');
                if (slot) {
                    const draggedOrder = parseInt(item.getAttribute('data-order'));
                    const slotIndex = parseInt(slot.getAttribute('data-index'));
                    const expectedOrder = slotIndex + 1;
                    
                    if (draggedOrder === expectedOrder) {
                        slot.classList.add('filled');
                        const cardClone = item.cloneNode(true);
                        cardClone.classList.remove('dragging');
                        cardClone.classList.add('placed-card');
                        cardClone.setAttribute('draggable', 'false');
                        slot.appendChild(cardClone);
                        
                        item.classList.add('placed');
                        item.setAttribute('draggable', 'false');
                        item.style.display = 'none';
                        
                        state.visualState.placed.add(draggedOrder);
                        state.scores.visual = state.visualState.placed.size;
                        updateScore('visual', state.scores.visual);
                        
                        showFeedback('visual-feedback', `¡Correcto! Orden ${draggedOrder}`, 'success');
                        
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
                        showFeedback('visual-feedback', 'Inténtalo de nuevo', 'error');
                        slot.classList.add('shake');
                        setTimeout(() => slot.classList.remove('shake'), 500);
                    }
                    
                    slot.classList.remove('drag-over');
                }
                
                // Ya se resetea en resetTouchDrag
            }
        );
        
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
        
        // Soporte táctil para iPad
        addTouchSupport(
            letterItem,
            (e, touch) => {
                const item = e.target.closest('.letter-item');
                if (item && item.classList.contains('placed')) {
                    e.preventDefault();
                    return;
                }
            },
            (e, touch, deltaX, deltaY) => {
                const item = activeTouchDrag.element;
                if (item) {
                    const elementBelow = getElementAtPoint(touch.clientX, touch.clientY);
                    const zone = elementBelow?.closest('.letters-drop-zone');
                    document.querySelectorAll('.letters-drop-zone').forEach(z => {
                        z.classList.remove('drag-over');
                    });
                    if (zone) {
                        zone.classList.add('drag-over');
                    }
                }
            },
            (e, touch) => {
                // Ya se resetea en resetTouchDrag
            },
            (e, touch, elementBelow) => {
                const item = activeTouchDrag.element;
                if (!item || item.classList.contains('placed')) return;
                
                const zone = elementBelow?.closest('.letters-drop-zone');
                if (zone) {
                    const letter = item.getAttribute('data-letter');
                    const isVowel = state.lettersState.vowels.includes(letter);
                    const isVowelZone = zone.classList.contains('vowel-zone');
                    
                    if ((isVowel && isVowelZone) || (!isVowel && !isVowelZone)) {
                        const letterClone = item.cloneNode(true);
                        letterClone.classList.remove('dragging');
                        letterClone.classList.add('placed-letter');
                        letterClone.setAttribute('draggable', 'false');
                        letterClone.style.fontSize = '2.5rem';
                        zone.appendChild(letterClone);
                        
                        item.classList.add('placed');
                        item.setAttribute('draggable', 'false');
                        item.style.opacity = '0.3';
                        
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
                        showFeedback('letters-feedback', 'Inténtalo de nuevo', 'error');
                        zone.classList.add('shake');
                        setTimeout(() => zone.classList.remove('shake'), 500);
                    }
                    
                    zone.classList.remove('drag-over');
                }
            }
        );
        
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

// ========== JUEGO: RUEDA ALEATORIA ==========
function initWheelGame() {
    const svg = document.querySelector('#wheel-svg');
    if (!svg) return;
    
    svg.innerHTML = '';
    const centerX = 200;
    const centerY = 200;
    const radius = 180;
    const numSegments = 9;
    const anglePerSegment = (2 * Math.PI) / numSegments;
    const colors = state.visualState.colors;
    
    // Crear segmentos de la rueda
    NUMBERS.forEach((num, index) => {
        const startAngle = index * anglePerSegment - Math.PI / 2;
        const endAngle = (index + 1) * anglePerSegment - Math.PI / 2;
        
        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);
        
        const largeArc = anglePerSegment > Math.PI ? 1 : 0;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        path.setAttribute('d', pathData);
        path.setAttribute('fill', getColorValue(colors[index % colors.length]));
        path.setAttribute('stroke', '#ffffff');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('data-number', num);
        path.classList.add('wheel-segment');
        
        // Texto del número
        const textAngle = startAngle + anglePerSegment / 2;
        const textX = centerX + (radius * 0.7) * Math.cos(textAngle);
        const textY = centerY + (radius * 0.7) * Math.sin(textAngle);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', textX);
        text.setAttribute('y', textY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-size', '36');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', '#000000');
        text.textContent = num;
        
        svg.appendChild(path);
        svg.appendChild(text);
    });
    
    // Hacer la rueda clickeable/táctil
    svg.addEventListener('click', spinWheel);
    svg.addEventListener('touchstart', (e) => {
        e.preventDefault();
        spinWheel();
    }, { passive: false });
    
    // Establecer número objetivo
    const targetNumber = Math.floor(Math.random() * 9) + 1;
    state.wheelState.targetNumber = targetNumber;
    document.getElementById('target-number-display').textContent = targetNumber;
}

function spinWheel() {
    if (state.wheelState.isSpinning) return;
    
    state.wheelState.isSpinning = true;
    const svg = document.querySelector('#wheel-svg');
    const resultDiv = document.querySelector('#wheel-result .result-number');
    const resultText = document.querySelector('#wheel-result p');
    
    // Rotación aleatoria (múltiplos de 360 + extra)
    const extraRotation = Math.random() * 360;
    const fullRotations = 5 + Math.floor(Math.random() * 5); // 5-9 vueltas completas
    const totalRotation = state.wheelState.currentRotation + (fullRotations * 360) + extraRotation;
    
    state.wheelState.currentRotation = totalRotation % 360;
    
    svg.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    svg.style.transform = `rotate(${totalRotation}deg)`;
    
    resultDiv.textContent = '?';
    resultText.textContent = 'Girando...';
    
    setTimeout(() => {
        // Calcular qué número está en la parte superior (apuntador)
        const normalizedRotation = (360 - (state.wheelState.currentRotation % 360)) % 360;
        const segmentAngle = 360 / 9; // 40 grados por segmento
        const segmentIndex = Math.floor(normalizedRotation / segmentAngle);
        const landedNumber = NUMBERS[segmentIndex];
        
        resultDiv.textContent = landedNumber;
        resultDiv.style.fontSize = '5rem';
        resultDiv.style.color = 'var(--accent-yellow)';
        
        if (landedNumber === state.wheelState.targetNumber) {
            showFeedback('wheel-feedback', `¡Encontraste el ${landedNumber}!`, 'success');
            state.wheelState.found.add(landedNumber);
            state.scores.wheel = state.wheelState.found.size;
            updateScore('wheel', state.scores.wheel);
            
            if (state.scores.wheel === 9) {
                setTimeout(() => showSuccessModal(), 1500);
            } else {
                // Nuevo número objetivo
                const remaining = NUMBERS.filter(n => !state.wheelState.found.has(n));
                const newTarget = remaining[Math.floor(Math.random() * remaining.length)];
                state.wheelState.targetNumber = newTarget;
                setTimeout(() => {
                    document.getElementById('target-number-display').textContent = newTarget;
                    resultText.textContent = `Busca el número ${newTarget}`;
                }, 2000);
            }
        } else {
            showFeedback('wheel-feedback', `Salió ${landedNumber}, pero buscas ${state.wheelState.targetNumber}`, 'error');
            resultText.textContent = `Sigue buscando el ${state.wheelState.targetNumber}`;
        }
        
        state.wheelState.isSpinning = false;
    }, 3000);
}

function resetWheelGame() {
    state.wheelState.currentRotation = 0;
    state.wheelState.isSpinning = false;
    state.wheelState.found.clear();
    state.scores.wheel = 0;
    updateScore('wheel', 0);
    
    const svg = document.querySelector('#wheel-svg');
    if (svg) {
        svg.style.transform = 'rotate(0deg)';
        svg.style.transition = '';
    }
    
    const resultDiv = document.querySelector('#wheel-result .result-number');
    const resultText = document.querySelector('#wheel-result p');
    if (resultDiv) {
        resultDiv.textContent = '?';
        resultDiv.style.fontSize = '';
        resultDiv.style.color = '';
    }
    if (resultText) {
        resultText.textContent = 'Toca la rueda para comenzar';
    }
    
    initWheelGame();
    clearFeedback('wheel-feedback');
}

// ========== JUEGO: CADA OVEJA CON SU PAREJA ==========
function initSheepGame() {
    const questionDiv = document.querySelector('#sheep-question');
    const answersDiv = document.querySelector('#sheep-answers');
    if (!questionDiv || !answersDiv) return;
    
    // Seleccionar número aleatorio que no haya sido completado
    const remaining = NUMBERS.filter(n => !state.sheepState.completed.has(n));
    if (remaining.length === 0) {
        showFeedback('sheep-feedback', '¡Completaste todos los números!', 'success');
        return;
    }
    
    const targetNumber = remaining[Math.floor(Math.random() * remaining.length)];
    state.sheepState.correctAnswer = targetNumber;
    
    // Crear pregunta
    questionDiv.innerHTML = `
        <div class="sheep-question-content">
            <h3>¿Cuántos elementos hay?</h3>
            <div class="sheep-visual">
                ${Array(targetNumber).fill(0).map(() => 
                    `<div class="sheep-dot" style="background-color: ${getColorValue(state.visualState.colors[Math.floor(Math.random() * state.visualState.colors.length)])}"></div>`
                ).join('')}
            </div>
        </div>
    `;
    
    // Crear respuestas (mezcladas)
    const wrongAnswers = NUMBERS.filter(n => n !== targetNumber)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    const allAnswers = [targetNumber, ...wrongAnswers].sort(() => Math.random() - 0.5);
    state.sheepState.answers = allAnswers;
    
    answersDiv.innerHTML = '';
    allAnswers.forEach(num => {
        const answerBtn = document.createElement('button');
        answerBtn.className = 'sheep-answer-btn';
        answerBtn.textContent = num;
        answerBtn.setAttribute('data-number', num);
        answerBtn.addEventListener('click', () => handleSheepAnswer(num, answerBtn));
        answerBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleSheepAnswer(num, answerBtn);
        }, { passive: false });
        answersDiv.appendChild(answerBtn);
    });
}

function handleSheepAnswer(number, button) {
    if (state.sheepState.completed.has(state.sheepState.correctAnswer)) {
        // Ya se completó esta pregunta
        return;
    }
    
    if (number === state.sheepState.correctAnswer) {
        // Correcto
        button.style.background = 'linear-gradient(135deg, var(--accent-green), #00cc77)';
        button.style.transform = 'scale(1.1)';
        button.style.opacity = '0';
        setTimeout(() => button.remove(), 500);
        
        state.sheepState.completed.add(state.sheepState.correctAnswer);
        state.scores.sheep = state.sheepState.completed.size;
        updateScore('sheep', state.scores.sheep);
        
        showFeedback('sheep-feedback', `¡Correcto! ${number} elementos`, 'success');
        
        if (state.scores.sheep === 9) {
            setTimeout(() => showSuccessModal(), 1500);
        } else {
            setTimeout(() => initSheepGame(), 1500);
        }
    } else {
        // Incorrecto
        button.classList.add('shake');
        showFeedback('sheep-feedback', 'Inténtalo de nuevo', 'error');
        setTimeout(() => button.classList.remove('shake'), 500);
    }
}

function resetSheepGame() {
    state.sheepState.completed.clear();
    state.sheepState.currentQuestion = null;
    state.sheepState.answers = [];
    state.sheepState.correctAnswer = null;
    state.scores.sheep = 0;
    updateScore('sheep', 0);
    
    initSheepGame();
    clearFeedback('sheep-feedback');
}

// ========== JUEGO: ABRECAJAS ==========
function initBoxesGame() {
    const grid = document.querySelector('#boxes-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Mezclar números
    const shuffled = [...NUMBERS].sort(() => Math.random() - 0.5);
    state.boxesState.numbers = shuffled;
    state.boxesState.opened.clear();
    
    shuffled.forEach((num, index) => {
        const box = document.createElement('div');
        box.className = 'box-item';
        box.setAttribute('data-number', num);
        box.setAttribute('data-index', index);
        box.setAttribute('aria-label', `Caja ${index + 1}`);
        
        box.innerHTML = `
            <div class="box-front">
                <i class="fas fa-box"></i>
                <span>Caja ${index + 1}</span>
            </div>
            <div class="box-back">
                <div class="box-number">${num}</div>
            </div>
        `;
        
        box.addEventListener('click', () => openBox(box, num));
        box.addEventListener('touchstart', (e) => {
            e.preventDefault();
            openBox(box, num);
        }, { passive: false });
        
        grid.appendChild(box);
    });
}

function openBox(box, number) {
    if (state.boxesState.opened.has(number)) return;
    
    box.classList.add('opened');
    state.boxesState.opened.add(number);
    state.scores.boxes = state.boxesState.opened.size;
    updateScore('boxes', state.scores.boxes);
    
    showFeedback('boxes-feedback', `¡Encontraste el número ${number}!`, 'success');
    
    if (state.scores.boxes === 9) {
        setTimeout(() => showSuccessModal(), 1500);
    }
}

function resetBoxesGame() {
    state.boxesState.opened.clear();
    state.boxesState.numbers = [];
    state.scores.boxes = 0;
    updateScore('boxes', 0);
    
    const grid = document.querySelector('#boxes-grid');
    if (grid) {
        grid.querySelectorAll('.box-item').forEach(box => {
            box.classList.remove('opened');
        });
    }
    
    initBoxesGame();
    clearFeedback('boxes-feedback');
}

// ========== JUEGO: TARJETAS FLASH ==========
function initFlashcardsGame() {
    // Crear tarjetas flash para cada número
    state.flashcardsState.cards = NUMBERS.map(num => ({
        question: `¿Cuántos elementos hay?`,
        answer: num,
        visual: Array(num).fill(0).map(() => 
            `<div class="flashcard-dot" style="background-color: ${getColorValue(state.visualState.colors[Math.floor(Math.random() * state.visualState.colors.length)])}"></div>`
        ).join('')
    }));
    
    state.flashcardsState.currentIndex = 0;
    state.flashcardsState.flipped = false;
    state.flashcardsState.completed.clear();
    
    showFlashcard();
}

function showFlashcard() {
    const card = state.flashcardsState.cards[state.flashcardsState.currentIndex];
    const flashcard = document.querySelector('#flashcard');
    const questionDiv = document.querySelector('#flashcard-question');
    const answerDiv = document.querySelector('#flashcard-answer');
    
    if (!flashcard || !questionDiv || !answerDiv) return;
    
    flashcard.classList.remove('flipped');
    state.flashcardsState.flipped = false;
    
    questionDiv.innerHTML = `
        <div class="flashcard-visual">${card.visual}</div>
        <div class="flashcard-question-text">${card.question}</div>
    `;
    
    answerDiv.innerHTML = `
        <div class="flashcard-answer-number">${card.answer}</div>
        <div class="flashcard-answer-text">elementos</div>
    `;
    
    // Hacer la tarjeta clickeable/táctil
    flashcard.onclick = flipFlashcard;
    flashcard.ontouchstart = (e) => {
        e.preventDefault();
        flipFlashcard();
    };
}

function flipFlashcard() {
    const flashcard = document.querySelector('#flashcard');
    if (!flashcard) return;
    
    state.flashcardsState.flipped = !state.flashcardsState.flipped;
    flashcard.classList.toggle('flipped', state.flashcardsState.flipped);
}

function nextFlashcard() {
    if (state.flashcardsState.currentIndex < state.flashcardsState.cards.length - 1) {
        state.flashcardsState.currentIndex++;
        showFlashcard();
    } else {
        // Completado
        showFeedback('flashcards-feedback', '¡Completaste todas las tarjetas!', 'success');
        setTimeout(() => showSuccessModal(), 1500);
    }
}

function resetFlashcardsGame() {
    state.flashcardsState.currentIndex = 0;
    state.flashcardsState.flipped = false;
    state.flashcardsState.completed.clear();
    state.scores.flashcards = 0;
    updateScore('flashcards', 0);
    
    initFlashcardsGame();
    clearFeedback('flashcards-feedback');
}

// Botón siguiente de flashcards
document.getElementById('flashcard-next')?.addEventListener('click', () => {
    if (state.flashcardsState.flipped) {
        nextFlashcard();
    } else {
        showFeedback('flashcards-feedback', 'Primero voltea la tarjeta', 'error');
    }
});

// ========== JUEGO: REORDENAR ==========
function initReorderGame() {
    const slotsContainer = document.querySelector('#reorder-slots');
    const itemsContainer = document.querySelector('#reorder-items');
    if (!slotsContainer || !itemsContainer) return;
    
    slotsContainer.innerHTML = '';
    itemsContainer.innerHTML = '';
    
    // Crear slots ordenados
    state.reorderState.correctOrder.forEach((num, index) => {
        const slot = document.createElement('div');
        slot.className = 'reorder-slot';
        slot.setAttribute('data-position', index);
        slot.setAttribute('data-number', num);
        slot.setAttribute('aria-label', `Posición ${index + 1} para número ${num}`);
        slot.textContent = index + 1;
        
        slot.addEventListener('dragover', handleReorderDragOver);
        slot.addEventListener('drop', handleReorderDrop);
        slot.addEventListener('dragenter', handleReorderDragEnter);
        slot.addEventListener('dragleave', handleReorderDragLeave);
        
        slotsContainer.appendChild(slot);
    });
    
    // Crear números mezclados
    const shuffled = [...NUMBERS].sort(() => Math.random() - 0.5);
    state.reorderState.items = shuffled;
    
    shuffled.forEach((num, index) => {
        const item = document.createElement('div');
        item.className = 'reorder-item';
        item.setAttribute('draggable', 'true');
        item.setAttribute('data-number', num);
        item.setAttribute('data-index', index);
        item.setAttribute('aria-label', `Número ${num}`);
        item.textContent = num;
        
        item.addEventListener('dragstart', handleReorderDragStart);
        item.addEventListener('dragend', handleReorderDragEnd);
        
        // Soporte táctil
        addTouchSupport(
            item,
            (e, touch) => {
                const it = e.target.closest('.reorder-item');
                if (it && it.classList.contains('placed')) {
                    e.preventDefault();
                    return;
                }
            },
            (e, touch, deltaX, deltaY) => {
                const it = activeTouchDrag.element;
                if (it) {
                    const elementBelow = getElementAtPoint(touch.clientX, touch.clientY);
                    const slot = elementBelow?.closest('.reorder-slot');
                    document.querySelectorAll('.reorder-slot').forEach(s => {
                        s.classList.remove('drag-over');
                    });
                    if (slot && !slot.classList.contains('filled')) {
                        slot.classList.add('drag-over');
                    }
                }
            },
            (e, touch) => {
                // Ya se resetea en resetTouchDrag
            },
            (e, touch, elementBelow) => {
                const it = activeTouchDrag.element;
                if (!it || it.classList.contains('placed')) return;
                
                const slot = elementBelow?.closest('.reorder-slot');
                if (slot) {
                    const draggedNumber = parseInt(it.getAttribute('data-number'));
                    const slotNumber = parseInt(slot.getAttribute('data-number'));
                    const slotPosition = parseInt(slot.getAttribute('data-position'));
                    const expectedNumber = state.reorderState.correctOrder[slotPosition];
                    
                    if (draggedNumber === expectedNumber) {
                        slot.classList.add('filled');
                        slot.innerHTML = draggedNumber;
                        slot.style.fontSize = '3rem';
                        slot.style.fontWeight = 'bold';
                        slot.style.color = 'var(--accent-green)';
                        
                        it.classList.add('placed');
                        it.setAttribute('draggable', 'false');
                        it.style.opacity = '0.3';
                        it.style.display = 'none';
                        
                        state.reorderState.placed.set(slotPosition, draggedNumber);
                        state.scores.reorder = state.reorderState.placed.size;
                        updateScore('reorder', state.scores.reorder);
                        
                        showFeedback('reorder-feedback', `¡Correcto! Número ${draggedNumber} en posición ${slotPosition + 1}`, 'success');
                        
                        if (state.scores.reorder === 9) {
                            setTimeout(() => showSuccessModal(), 1500);
                        }
                    } else {
                        showFeedback('reorder-feedback', 'Inténtalo de nuevo', 'error');
                        slot.classList.add('shake');
                        setTimeout(() => slot.classList.remove('shake'), 500);
                    }
                    
                    slot.classList.remove('drag-over');
                }
            }
        );
        
        itemsContainer.appendChild(item);
    });
}

function handleReorderDragStart(e) {
    const item = e.target.closest('.reorder-item');
    if (!item || item.classList.contains('placed')) {
        e.preventDefault();
        return;
    }
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.getAttribute('data-number'));
}

function handleReorderDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleReorderDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleReorderDragEnter(e) {
    e.preventDefault();
    const slot = e.target.closest('.reorder-slot');
    if (slot && !slot.classList.contains('filled')) {
        slot.classList.add('drag-over');
    }
}

function handleReorderDragLeave(e) {
    const slot = e.target.closest('.reorder-slot');
    if (slot) {
        slot.classList.remove('drag-over');
    }
}

function handleReorderDrop(e) {
    e.preventDefault();
    const slot = e.target.closest('.reorder-slot');
    if (!slot) return;
    
    slot.classList.remove('drag-over');
    
    const draggedNumber = parseInt(e.dataTransfer.getData('text/plain'));
    const slotPosition = parseInt(slot.getAttribute('data-position'));
    const expectedNumber = state.reorderState.correctOrder[slotPosition];
    
    const item = document.querySelector(`.reorder-item[data-number="${draggedNumber}"]:not(.placed)`);
    
    if (!item) return;
    
    if (draggedNumber === expectedNumber) {
        slot.classList.add('filled');
        slot.innerHTML = draggedNumber;
        slot.style.fontSize = '3rem';
        slot.style.fontWeight = 'bold';
        slot.style.color = 'var(--accent-green)';
        
        item.classList.add('placed');
        item.setAttribute('draggable', 'false');
        item.style.opacity = '0.3';
        
        state.reorderState.placed.set(slotPosition, draggedNumber);
        state.scores.reorder = state.reorderState.placed.size;
        updateScore('reorder', state.scores.reorder);
        
        showFeedback('reorder-feedback', `¡Correcto! Número ${draggedNumber}`, 'success');
        
        if (state.scores.reorder === 9) {
            setTimeout(() => showSuccessModal(), 1500);
        }
    } else {
        showFeedback('reorder-feedback', 'Inténtalo de nuevo', 'error');
        slot.classList.add('shake');
        setTimeout(() => slot.classList.remove('shake'), 500);
    }
}

function resetReorderGame() {
    state.reorderState.placed.clear();
    state.scores.reorder = 0;
    updateScore('reorder', 0);
    
    const slotsContainer = document.querySelector('#reorder-slots');
    const itemsContainer = document.querySelector('#reorder-items');
    
    if (slotsContainer) {
        slotsContainer.querySelectorAll('.reorder-slot').forEach(slot => {
            slot.classList.remove('filled', 'drag-over');
            const pos = parseInt(slot.getAttribute('data-position'));
            slot.innerHTML = pos + 1;
            slot.style.fontSize = '';
            slot.style.fontWeight = '';
            slot.style.color = '';
        });
    }
    
    if (itemsContainer) {
        itemsContainer.querySelectorAll('.reorder-item').forEach(item => {
            item.classList.remove('placed', 'dragging');
            item.setAttribute('draggable', 'true');
            item.style.opacity = '';
        });
        
        // Mezclar de nuevo
        const itemsArray = Array.from(itemsContainer.children);
        itemsArray.sort(() => Math.random() - 0.5);
        itemsArray.forEach(item => itemsContainer.appendChild(item));
    }
    
    initReorderGame();
    clearFeedback('reorder-feedback');
}

// ========== JUEGO: CUESTIONARIO ==========
function initQuizGame() {
    const questionDiv = document.querySelector('#quiz-question');
    const optionsDiv = document.querySelector('#quiz-options');
    if (!questionDiv || !optionsDiv) return;
    
    // Seleccionar número que no haya sido completado
    const remaining = NUMBERS.filter(n => !state.quizState.completed.has(n));
    if (remaining.length === 0) {
        showFeedback('quiz-feedback', '¡Completaste todas las preguntas!', 'success');
        setTimeout(() => showSuccessModal(), 1500);
        return;
    }
    
    const targetNumber = remaining[Math.floor(Math.random() * remaining.length)];
    state.quizState.currentAnswer = targetNumber;
    
    // Crear pregunta visual
    const questionTypes = [
        {
            type: 'count',
            text: '¿Cuántos elementos hay?',
            visual: Array(targetNumber).fill(0).map(() => 
                `<div class="quiz-dot" style="background-color: ${getColorValue(state.visualState.colors[Math.floor(Math.random() * state.visualState.colors.length)])}"></div>`
            ).join('')
        },
        {
            type: 'number',
            text: `¿Qué número viene después del ${targetNumber - 1}?`,
            visual: `<div class="quiz-number-sequence">${targetNumber - 1} → ?</div>`
        },
        {
            type: 'before',
            text: `¿Qué número viene antes del ${targetNumber + 1}?`,
            visual: `<div class="quiz-number-sequence">? → ${targetNumber + 1}</div>`
        }
    ];
    
    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    state.quizState.currentQuestion = questionType;
    
    questionDiv.innerHTML = `
        <div class="quiz-question-content">
            <h3>${questionType.text}</h3>
            <div class="quiz-visual">${questionType.visual}</div>
        </div>
    `;
    
    // Crear opciones (mezcladas)
    const wrongOptions = NUMBERS.filter(n => n !== targetNumber)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    const allOptions = [targetNumber, ...wrongOptions].sort(() => Math.random() - 0.5);
    
    optionsDiv.innerHTML = '';
    allOptions.forEach(num => {
        const optionBtn = document.createElement('button');
        optionBtn.className = 'quiz-option-btn';
        optionBtn.textContent = num;
        optionBtn.setAttribute('data-number', num);
        optionBtn.addEventListener('click', () => handleQuizAnswer(num, optionBtn));
        optionBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleQuizAnswer(num, optionBtn);
        }, { passive: false });
        optionsDiv.appendChild(optionBtn);
    });
}

function handleQuizAnswer(number, button) {
    if (state.quizState.completed.has(state.quizState.currentAnswer)) return;
    
    if (number === state.quizState.currentAnswer) {
        button.style.background = 'linear-gradient(135deg, var(--accent-green), #00cc77)';
        button.style.transform = 'scale(1.1)';
        button.style.borderColor = 'var(--accent-yellow)';
        
        state.quizState.completed.add(state.quizState.currentAnswer);
        state.scores.quiz = state.quizState.completed.size;
        updateScore('quiz', state.scores.quiz);
        
        showFeedback('quiz-feedback', `¡Correcto! La respuesta es ${number}`, 'success');
        
        if (state.scores.quiz === 9) {
            setTimeout(() => showSuccessModal(), 1500);
        } else {
            setTimeout(() => initQuizGame(), 1500);
        }
    } else {
        button.classList.add('shake');
        showFeedback('quiz-feedback', 'Inténtalo de nuevo', 'error');
        setTimeout(() => button.classList.remove('shake'), 500);
    }
}

function resetQuizGame() {
    state.quizState.completed.clear();
    state.quizState.currentQuestion = null;
    state.quizState.currentAnswer = null;
    state.scores.quiz = 0;
    updateScore('quiz', 0);
    
    initQuizGame();
    clearFeedback('quiz-feedback');
}

// ========== JUEGO: ORDENAR POR GRUPO ==========
function initGroupGame() {
    const zonesContainer = document.querySelector('#group-zones');
    const itemsContainer = document.querySelector('#group-items');
    if (!zonesContainer || !itemsContainer) return;
    
    zonesContainer.innerHTML = '';
    itemsContainer.innerHTML = '';
    
    // Crear zonas de grupo
    state.groupState.groups.forEach((group, index) => {
        const zone = document.createElement('div');
        zone.className = 'group-zone';
        zone.setAttribute('data-group-index', index);
        zone.style.borderColor = `var(--accent-${group.color})`;
        zone.style.background = `linear-gradient(135deg, var(--accent-${group.color}), rgba(0, 0, 0, 0.3))`;
        
        const title = document.createElement('h3');
        title.textContent = group.name;
        title.style.color = `var(--accent-${group.color})`;
        zone.appendChild(title);
        
        const numbersList = document.createElement('div');
        numbersList.className = 'group-numbers-list';
        numbersList.setAttribute('data-group-index', index);
        zone.appendChild(numbersList);
        
        zone.addEventListener('dragover', handleGroupDragOver);
        zone.addEventListener('drop', handleGroupDrop);
        zone.addEventListener('dragenter', handleGroupDragEnter);
        zone.addEventListener('dragleave', handleGroupDragLeave);
        
        zonesContainer.appendChild(zone);
    });
    
    // Crear números mezclados
    const shuffled = [...NUMBERS].sort(() => Math.random() - 0.5);
    
    shuffled.forEach(num => {
        const item = document.createElement('div');
        item.className = 'group-item';
        item.setAttribute('draggable', 'true');
        item.setAttribute('data-number', num);
        item.setAttribute('aria-label', `Número ${num}`);
        item.textContent = num;
        
        item.addEventListener('dragstart', handleGroupDragStart);
        item.addEventListener('dragend', handleGroupDragEnd);
        
        // Soporte táctil
        addTouchSupport(
            item,
            (e, touch) => {
                const it = e.target.closest('.group-item');
                if (it && it.classList.contains('placed')) {
                    e.preventDefault();
                    return;
                }
            },
            (e, touch, deltaX, deltaY) => {
                const it = activeTouchDrag.element;
                if (it) {
                    const elementBelow = getElementAtPoint(touch.clientX, touch.clientY);
                    const zone = elementBelow?.closest('.group-zone');
                    document.querySelectorAll('.group-zone').forEach(z => {
                        z.classList.remove('drag-over');
                    });
                    if (zone) {
                        zone.classList.add('drag-over');
                    }
                }
            },
            (e, touch) => {
                // Ya se resetea en resetTouchDrag
            },
            (e, touch, elementBelow) => {
                const it = activeTouchDrag.element;
                if (!it || it.classList.contains('placed')) return;
                
                const zone = elementBelow?.closest('.group-zone');
                if (zone) {
                    const draggedNumber = parseInt(it.getAttribute('data-number'));
                    const groupIndex = parseInt(zone.getAttribute('data-group-index'));
                    const group = state.groupState.groups[groupIndex];
                    
                    if (group.numbers.includes(draggedNumber)) {
                        const numbersList = zone.querySelector('.group-numbers-list');
                        const numberDisplay = document.createElement('div');
                        numberDisplay.className = 'group-number-display';
                        numberDisplay.textContent = draggedNumber;
                        numbersList.appendChild(numberDisplay);
                        
                        it.classList.add('placed');
                        it.setAttribute('draggable', 'false');
                        it.style.opacity = '0.3';
                        it.style.display = 'none';
                        
                        state.groupState.placed.set(draggedNumber, groupIndex);
                        state.scores.group = state.groupState.placed.size;
                        updateScore('group', state.scores.group);
                        
                        showFeedback('group-feedback', `¡Correcto! ${draggedNumber} va en ${group.name}`, 'success');
                        
                        if (state.scores.group === 9) {
                            setTimeout(() => showSuccessModal(), 1500);
                        }
                    } else {
                        showFeedback('group-feedback', 'Inténtalo de nuevo', 'error');
                        zone.classList.add('shake');
                        setTimeout(() => zone.classList.remove('shake'), 500);
                    }
                    
                    zone.classList.remove('drag-over');
                }
                
                // Ya se resetea en resetTouchDrag
            }
        );
        
        itemsContainer.appendChild(item);
    });
}

function handleGroupDragStart(e) {
    const item = e.target.closest('.group-item');
    if (!item || item.classList.contains('placed')) {
        e.preventDefault();
        return;
    }
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.getAttribute('data-number'));
}

function handleGroupDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleGroupDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleGroupDragEnter(e) {
    e.preventDefault();
    const zone = e.target.closest('.group-zone');
    if (zone) {
        zone.classList.add('drag-over');
    }
}

function handleGroupDragLeave(e) {
    const zone = e.target.closest('.group-zone');
    if (zone) {
        zone.classList.remove('drag-over');
    }
}

function handleGroupDrop(e) {
    e.preventDefault();
    const zone = e.target.closest('.group-zone');
    if (!zone) return;
    
    zone.classList.remove('drag-over');
    
    const draggedNumber = parseInt(e.dataTransfer.getData('text/plain'));
    const groupIndex = parseInt(zone.getAttribute('data-group-index'));
    const group = state.groupState.groups[groupIndex];
    
    const item = document.querySelector(`.group-item[data-number="${draggedNumber}"]:not(.placed)`);
    if (!item) return;
    
    if (group.numbers.includes(draggedNumber)) {
        const numbersList = zone.querySelector('.group-numbers-list');
        const numberDisplay = document.createElement('div');
        numberDisplay.className = 'group-number-display';
        numberDisplay.textContent = draggedNumber;
        numbersList.appendChild(numberDisplay);
        
        item.classList.add('placed');
        item.setAttribute('draggable', 'false');
        item.style.opacity = '0.3';
        
        state.groupState.placed.set(draggedNumber, groupIndex);
        state.scores.group = state.groupState.placed.size;
        updateScore('group', state.scores.group);
        
        showFeedback('group-feedback', `¡Correcto! ${draggedNumber} va en ${group.name}`, 'success');
        
        if (state.scores.group === 9) {
            setTimeout(() => showSuccessModal(), 1500);
        }
    } else {
        showFeedback('group-feedback', 'Inténtalo de nuevo', 'error');
        zone.classList.add('shake');
        setTimeout(() => zone.classList.remove('shake'), 500);
    }
}

function resetGroupGame() {
    state.groupState.placed.clear();
    state.scores.group = 0;
    updateScore('group', 0);
    
    const itemsContainer = document.querySelector('#group-items');
    if (itemsContainer) {
        itemsContainer.querySelectorAll('.group-item').forEach(item => {
            item.classList.remove('placed', 'dragging');
            item.setAttribute('draggable', 'true');
            item.style.opacity = '';
        });
        
        const itemsArray = Array.from(itemsContainer.children);
        itemsArray.sort(() => Math.random() - 0.5);
        itemsArray.forEach(item => itemsContainer.appendChild(item));
    }
    
    initGroupGame();
    clearFeedback('group-feedback');
}

// ========== JUEGO: COMPLETAR ==========
function initCompleteGame() {
    const sentenceDiv = document.querySelector('#complete-sentence');
    const optionsDiv = document.querySelector('#complete-options');
    if (!sentenceDiv || !optionsDiv) return;
    
    // Seleccionar número que no haya sido completado
    const remaining = NUMBERS.filter(n => !state.completeState.completed.has(n));
    if (remaining.length === 0) {
        showFeedback('complete-feedback', '¡Completaste todas las frases!', 'success');
        setTimeout(() => showSuccessModal(), 1500);
        return;
    }
    
    const targetNumber = remaining[Math.floor(Math.random() * remaining.length)];
    
    const sentences = [
        `Hay ${targetNumber} elementos`,
        `El número ${targetNumber} es mayor que ${targetNumber - 1}`,
        `Si tengo ${targetNumber - 1} y añado 1, tengo ${targetNumber}`,
        `El número ${targetNumber} tiene ${targetNumber} unidades`
    ];
    
    const sentence = sentences[Math.floor(Math.random() * sentences.length)];
    const blankIndex = sentence.indexOf(String(targetNumber));
    
    sentenceDiv.innerHTML = `
        <div class="complete-sentence-content">
            ${sentence.split(String(targetNumber)).map((part, index, arr) => {
                if (index === arr.length - 1) return part;
                return part + `<span class="complete-blank" data-number="${targetNumber}">___</span>`;
            }).join('')}
        </div>
    `;
    
    state.completeState.currentSentence = { text: sentence, number: targetNumber };
    
    // Crear opciones (mezcladas)
    const wrongOptions = NUMBERS.filter(n => n !== targetNumber)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    const allOptions = [targetNumber, ...wrongOptions].sort(() => Math.random() - 0.5);
    
    optionsDiv.innerHTML = '';
    allOptions.forEach(num => {
        const optionBtn = document.createElement('div');
        optionBtn.className = 'complete-option';
        optionBtn.setAttribute('draggable', 'true');
        optionBtn.setAttribute('data-number', num);
        optionBtn.textContent = num;
        
        optionBtn.addEventListener('dragstart', handleCompleteDragStart);
        optionBtn.addEventListener('dragend', handleCompleteDragEnd);
        
        // Soporte táctil
        addTouchSupport(
            optionBtn,
            (e, touch) => {
                const it = e.target.closest('.complete-option');
                if (it && it.classList.contains('used')) {
                    e.preventDefault();
                    return;
                }
            },
            (e, touch, deltaX, deltaY) => {
                const it = activeTouchDrag.element;
                if (it) {
                    const elementBelow = getElementAtPoint(touch.clientX, touch.clientY);
                    const blank = elementBelow?.closest('.complete-blank');
                    document.querySelectorAll('.complete-blank').forEach(b => {
                        b.classList.remove('drag-over');
                    });
                    if (blank) {
                        blank.classList.add('drag-over');
                    }
                }
            },
            (e, touch) => {
                // Ya se resetea en resetTouchDrag
            },
            (e, touch, elementBelow) => {
                const it = activeTouchDrag.element;
                if (!it || it.classList.contains('used')) return;
                
                const blank = elementBelow?.closest('.complete-blank');
                if (blank) {
                    const draggedNumber = parseInt(it.getAttribute('data-number'));
                    const correctNumber = parseInt(blank.getAttribute('data-number'));
                    
                    if (draggedNumber === correctNumber) {
                        blank.textContent = draggedNumber;
                        blank.classList.add('filled');
                        blank.style.color = 'var(--accent-green)';
                        blank.style.fontWeight = 'bold';
                        
                        it.classList.add('used');
                        it.setAttribute('draggable', 'false');
                        it.style.opacity = '0.3';
                        it.style.display = 'none';
                        
                        state.completeState.completed.add(correctNumber);
                        state.scores.complete = state.completeState.completed.size;
                        updateScore('complete', state.scores.complete);
                        
                        showFeedback('complete-feedback', `¡Correcto! El número es ${draggedNumber}`, 'success');
                        
                        if (state.scores.complete === 9) {
                            setTimeout(() => showSuccessModal(), 1500);
                        } else {
                            setTimeout(() => initCompleteGame(), 1500);
                        }
                    } else {
                        showFeedback('complete-feedback', 'Inténtalo de nuevo', 'error');
                        blank.classList.add('shake');
                        setTimeout(() => blank.classList.remove('shake'), 500);
                    }
                    
                    blank.classList.remove('drag-over');
                }
                
                // Ya se resetea en resetTouchDrag
            }
        );
        
        optionsDiv.appendChild(optionBtn);
    });
}

function handleCompleteDragStart(e) {
    const item = e.target.closest('.complete-option');
    if (!item || item.classList.contains('used')) {
        e.preventDefault();
        return;
    }
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.getAttribute('data-number'));
}

function handleCompleteDragEnd(e) {
    e.target.classList.remove('dragging');
}

function resetCompleteGame() {
    state.completeState.completed.clear();
    state.completeState.currentSentence = null;
    state.completeState.blanks = [];
    state.scores.complete = 0;
    updateScore('complete', 0);
    
    initCompleteGame();
    clearFeedback('complete-feedback');
}

// ========== JUEGO: CARTAS AL AZAR ==========
function initCardsGame() {
    const deck = document.querySelector('#cards-deck');
    const display = document.querySelector('#cards-display');
    const targetDiv = document.querySelector('#cards-target-number');
    
    if (!deck || !display || !targetDiv) return;
    
    // Mezclar números para el mazo
    state.cardsState.deck = [...NUMBERS].sort(() => Math.random() - 0.5);
    state.cardsState.drawn = [];
    state.cardsState.found.clear();
    
    // Establecer número objetivo
    const targetNumber = Math.floor(Math.random() * 9) + 1;
    state.cardsState.targetNumber = targetNumber;
    targetDiv.textContent = targetNumber;
    
    display.innerHTML = '';
    
    // Hacer el mazo clickeable/táctil
    deck.onclick = drawCard;
    deck.ontouchstart = (e) => {
        e.preventDefault();
        drawCard();
    };
}

function drawCard() {
    if (state.cardsState.deck.length === 0) {
        showFeedback('cards-feedback', 'No quedan más cartas. Reinicia el juego.', 'error');
        return;
    }
    
    const drawnNumber = state.cardsState.deck.pop();
    state.cardsState.drawn.push(drawnNumber);
    
    const display = document.querySelector('#cards-display');
    const card = document.createElement('div');
    card.className = 'random-card';
    card.textContent = drawnNumber;
    card.style.animation = 'cardFlip 0.5s ease-out';
    
    if (drawnNumber === state.cardsState.targetNumber) {
        card.style.background = 'linear-gradient(135deg, var(--accent-green), #00cc77)';
        card.style.borderColor = 'var(--accent-yellow)';
        card.style.transform = 'scale(1.2)';
        
        state.cardsState.found.add(drawnNumber);
        state.scores.cards = state.cardsState.found.size;
        updateScore('cards', state.scores.cards);
        
        showFeedback('cards-feedback', `¡Encontraste el ${drawnNumber}!`, 'success');
        
        if (state.scores.cards === 9) {
            setTimeout(() => showSuccessModal(), 1500);
        } else {
            // Nuevo número objetivo
            const remaining = NUMBERS.filter(n => !state.cardsState.found.has(n));
            if (remaining.length > 0) {
                const newTarget = remaining[Math.floor(Math.random() * remaining.length)];
                state.cardsState.targetNumber = newTarget;
                setTimeout(() => {
                    document.querySelector('#cards-target-number').textContent = newTarget;
                }, 2000);
            }
        }
    } else {
        card.style.background = 'linear-gradient(135deg, var(--bg-card), var(--bg-card-hover))';
    }
    
    display.appendChild(card);
    
    // Limitar número de cartas visibles
    const cards = display.querySelectorAll('.random-card');
    if (cards.length > 6) {
        cards[0].remove();
    }
}

function resetCardsGame() {
    state.cardsState.deck = [];
    state.cardsState.drawn = [];
    state.cardsState.found.clear();
    state.scores.cards = 0;
    updateScore('cards', 0);
    
    const display = document.querySelector('#cards-display');
    if (display) {
        display.innerHTML = '';
    }
    
    initCardsGame();
    clearFeedback('cards-feedback');
}

// Prevenir comportamiento por defecto en drag
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
});

