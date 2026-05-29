/**
 * NEXUS BOARD PRO - CORE APPLICATION SYSTEM ARCHITECTURE
 * Optimizations: Active Memory Cleanup, Event Delegation, Granular Updates, Live Interactive Chatbot
 */

// Global Application Core State
let appState = {
    username: "Prajwal Shetty S",
    tasks: [],
    activity: [],
    currentMode: "focus",
    currentTheme: "theme-space",
    stopwatch: {
        running: false,
        seconds: 0,
        token: null
    }
};

// Application System Constants
const STORAGE_KEY = "nexus-board-state-matrix";
let botDebounceTimer = null;
let chartInstance = null;

// Initialization Hook on DOM Content Ready
document.addEventListener("DOMContentLoaded", () => {
    loadSavedWorkspaceState();
    initializeGlobalEventDelegates();
    startLiveClockEngine();
    syncUIModeAndTheme();
    refreshMetricsGrid();
    renderActivePage("dashboard");
    
    // Setup initial analytics rendering if active
    setTimeout(() => { updateAnalyticsVisualization(); }, 100);
});

// Load persistent data layers securely
function loadSavedWorkspaceState() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            appState = { ...appState, ...parsed };
            // Ensure runtime parameters are cleanly reset on initialization
            appState.stopwatch.running = false;
            appState.stopwatch.token = null;
        }
    } catch (e) {
        console.error("Local data ingestion failed, initializing clean buffers.", e);
    }
    // Perform targeted element generation across views
    populateKanbanBoard();
    populateActivityFeed();
    populateProjectClusters();
    populateCalendarLineup();
}

// Persist data loops safely without clogging the processing thread
function persistStateToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
        console.error("Critical error mapping state modifications to storage vectors:", e);
    }
}

/**
 * ARCHITECTURAL FIX 1: GLOBAL EVENT DELEGATION
 * Completely eliminates memory leaks caused by stacking click listeners on card matrices.
 */
function initializeGlobalEventDelegates() {
    // Top-level Event Capture for Main Layout Container
    document.body.addEventListener("click", (e) => {
        const target = e.target;

        // Navigation Menu Routing
        const menuItem = target.closest(".menu-item");
        if (menuItem && !menuItem.classList.contains("export-action-btn") && !target.closest(".import-action-label")) {
            const desiredPage = menuItem.dataset.page;
            if (desiredPage) {
                document.querySelectorAll(".menu-item").forEach(b => b.classList.remove("active"));
                menuItem.classList.add("active");
                renderActivePage(desiredPage);
            }
            return;
        }

        // Active Workspace Profile Updates
        if (target.closest("#editNameBtn")) {
            const inputName = prompt("Assign custom identity mapping to workspace signature:", appState.username);
            if (inputName && inputName.trim() !== "") {
                appState.username = inputName.trim();
                document.getElementById("userNameDisplay").innerText = appState.username;
                document.getElementById("mobileHudTitle").innerText = `Nexus Board: ${appState.username}`;
                document.getElementById("greetingHeader").innerText = `Welcome back, ${appState.username}`;
                logSystemChange(`Profile modified to "${appState.username}"`);
                persistStateToStorage();
            }
            return;
        }

        // Focus Profile State Strips
        const modeBtn = target.closest(".mode-btn");
        if (modeBtn) {
            const targetedMode = modeBtn.dataset.mode;
            document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
            modeBtn.classList.add("active");
            appState.currentMode = targetedMode;
            syncUIModeAndTheme();
            logSystemChange(`Workspace operation variant mutated to: ${targetedMode.toUpperCase()}`);
            persistStateToStorage();
            return;
        }

        // Theme Variant Ingestions
        const themeCard = target.closest(".theme-card");
        if (themeCard) {
            const nextTheme = themeCard.dataset.theme;
            appState.currentTheme = nextTheme;
            syncUIModeAndTheme();
            spawnToastMessage(`Environment skin successfully initialized to ${nextTheme.replace('theme-', '').toUpperCase()}`, "success");
            persistStateToStorage();
            return;
        }

        // Modal Visibility Controls
        if (target.closest("#newTaskBtn") || target.closest("#mobileNewTaskBtn")) {
            document.getElementById("taskModal").classList.remove("hidden");
            return;
        }
        if (target.closest("#closeModal") || target.id === "taskModal") {
            document.getElementById("taskModal").classList.add("hidden");
            return;
        }

        // Inline Action Toggles: Card Demolitions & Target Transformations
        if (target.classList.contains("delete-card-btn")) {
            const matchingCardId = target.dataset.id;
            purgeTargetedTask(matchingCardId);
            return;
        }

        // Focus Sprint Controller Operations
        if (target.id === "swStartBtn") toggleFocusClock(true);
        if (target.id === "swPauseBtn") toggleFocusClock(false);
        if (target.id === "swResetBtn") resetFocusClock();

        // Terminal Chat Activation Click Element
        if (target.id === "submitBotQueryBtn") {
            executeZiaChatPipeline();
        }
    });

    // Modal Task Configuration Saving Hook
    const saveTaskBtn = document.getElementById("createTaskBtn");
    if (saveTaskBtn) {
        saveTaskBtn.onclick = () => {
            const name = document.getElementById("taskInput").value.trim();
            const tagsRaw = document.getElementById("tagsInput").value.trim();
            const boardName = document.getElementById("boardInput").value.trim() || "General Workspace";
            const inputDate = document.getElementById("dateInput").value;
            const priority = document.getElementById("priorityInput").value;

            if (!name) {
                spawnToastMessage("Action description title parameter cannot remain empty.", "danger");
                return;
            }

            const constructedTask = {
                id: "card-vector-" + Date.now() + Math.floor(Math.random() * 1000),
                title: name,
                board: boardName,
                date: inputDate || new Date().toISOString().split('T')[0],
                priority: priority,
                status: "backlog",
                tags: tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(t => t.length > 0) : []
            };

            appState.tasks.push(constructedTask);
            logSystemChange(`Task card structured: "${name}" initialized inside ${boardName}`);
            
            // Re-flush pipeline nodes safely
            persistStateToStorage();
            populateKanbanBoard();
            refreshMetricsGrid();
            populateProjectClusters();
            populateCalendarLineup();
            
            // Clean up modal states completely
            document.getElementById("taskInput").value = "";
            document.getElementById("tagsInput").value = "";
            document.getElementById("boardInput").value = "";
            document.getElementById("dateInput").value = "";
            document.getElementById("taskModal").classList.add("hidden");
            spawnToastMessage("New assignment appended successfully.", "success");
        };
    }

    // Dynamic Filter Task Event Hook Input Handler
    const searchFilterNode = document.getElementById("searchInput");
    if (searchFilterNode) {
        searchFilterNode.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll(".task-card");
            cards.forEach(card => {
                const innerText = card.innerText.toLowerCase();
                card.style.display = innerText.includes(query) ? "block" : "none";
            });
        });
    }

    // Interactive Terminal Chat Hook Mapping Enter Key to Zia Actions
    const botInputArea = document.getElementById("botInputField");
    if (botInputArea) {
        botInputArea.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                executeZiaChatPipeline();
            }
        });
    }

    // Data Export Configuration Pipeline
    document.getElementById("exportStateBtn").onclick = () => {
        const payload = JSON.stringify(appState, null, 2);
        const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(payload);
        const auxiliaryDownloadNode = document.createElement("a");
        auxiliaryDownloadNode.setAttribute("href", dataUri);
        auxiliaryDownloadNode.setAttribute("download", `nexus_backup_${Date.now()}.json`);
        document.body.appendChild(auxiliaryDownloadNode);
        auxiliaryDownloadNode.click();
        auxiliaryDownloadNode.remove();
        spawnToastMessage("System database backup export package fired successfully.", "success");
    };

    // Data Restore/Import Verification Handlers
    const dataRestoreInputNode = document.getElementById("importStateInput");
    if (dataRestoreInputNode) {
        dataRestoreInputNode.addEventListener("change", (e) => {
            const linkedFile = e.target.files[0];
            if (!linkedFile) return;
            const dataStreamReader = new FileReader();
            dataStreamReader.onload = (event) => {
                try {
                    const extractedData = JSON.parse(event.target.result);
                    if (extractedData.tasks && extractedData.activity) {
                        appState = { ...appState, ...extractedData };
                        persistStateToStorage();
                        location.reload();
                    } else {
                        spawnToastMessage("Invalid engine schema metadata parsed inside recovery block.", "danger");
                    }
                } catch (err) {
                    spawnToastMessage("Failed to process local JSON cluster backup payload structural streams.", "danger");
                }
            };
            dataStreamReader.readAsText(linkedFile);
        });
    }

    // Initalize HTML5 Drag and Drop Events System Setup 
    setupDragAndDropSystems();
}

/**
 * ARCHITECTURAL FIX 2: GRANULAR DOM RE-RENDERING 
 * Renders target modules independently to prevent total DOM wipe cycles.
 */
function renderActivePage(targetPageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
        page.style.setProperty("display", "none", "important");
    });
    
    const chosenViewNode = document.getElementById(`${targetPageId}-page`);
    if (chosenViewNode) {
        chosenViewNode.classList.add("active-page");
        chosenViewNode.style.setProperty("display", "block", "important");
    }

    // Isolated lazy rendering evaluation blocks
    if (targetPageId === "analytics") updateAnalyticsVisualization();
    if (targetPageId === "boards") populateProjectClusters();
    if (targetPageId === "calendar") populateCalendarLineup();
    if (targetPageId === "activity") populateActivityFeed();
}

// Structural Task Creation Dynamic Engine
function populateKanbanBoard() {
    const buckets = {
        backlog: document.getElementById("backlog"),
        progress: document.getElementById("progress"),
        review: document.getElementById("review"),
        completed: document.getElementById("completed")
    };

    // Flush active lanes completely before rendering clean nodes
    Object.values(buckets).forEach(b => { if(b) b.innerHTML = ""; });

    appState.tasks.forEach(task => {
        const structuralLane = buckets[task.status];
        if (!structuralLane) return;

        const taskCard = document.createElement("div");
        taskCard.className = `task-card priority-${task.priority.toLowerCase()}`;
        taskCard.id = task.id;
        taskCard.draggable = true;

        // Populate card configuration content maps
        let renderedTagBadges = task.tags.map(t => `<span class="tag">${t}</span>`).join("");
        
        taskCard.innerHTML = `
            <button class="delete-card-btn" data-id="${task.id}" title="Purge Card">&times;</button>
            <div class="task-title">${escapeHTMLMarkup(task.title)}</div>
            <div class="task-tags">${renderedTagBadges}</div>
            <div class="task-metadata-footer">
                <span class="meta-board-tag">📁 ${escapeHTMLMarkup(task.board)}</span>
                <span class="meta-date-tag">📅 ${task.date}</span>
            </div>
        `;

        structuralLane.appendChild(taskCard);
    });

    // Rebind active drag state event arrays directly onto the new cards
    bindTaskDragMetadataListeners();
}

// Bind native drag lifecycle tracking properties onto elements
function bindTaskDragMetadataListeners() {
    const cards = document.querySelectorAll(".task-card");
    cards.forEach(card => {
        card.addEventListener("dragstart", () => { card.classList.add("dragging"); });
        card.addEventListener("dragend", () => { card.classList.remove("dragging"); });
    });
}

// Global Board Level Dropzones configurations
function setupDragAndDropSystems() {
    const columns = document.querySelectorAll(".board-column");
    const trashBin = document.getElementById("trashDropzone");

    columns.forEach(col => {
        col.addEventListener("dragover", (e) => {
            e.preventDefault();
            col.classList.add("drag-hovering-active");
        });
        col.addEventListener("dragleave", () => { col.classList.remove("drag-hovering-active"); });
        col.addEventListener("drop", (e) => {
            e.preventDefault();
            col.classList.remove("drag-hovering-active");
            const structuralDraggingNode = document.querySelector(".dragging");
            if (!structuralDraggingNode) return;

            const targetLaneStatus = col.dataset.status;
            const targetTaskObj = appState.tasks.find(t => t.id === structuralDraggingNode.id);

            if (targetTaskObj && targetTaskObj.status !== targetLaneStatus) {
                const primaryOldStatusName = targetTaskObj.status.toUpperCase();
                targetTaskObj.status = targetLaneStatus;
                
                logSystemChange(`Moved "${targetTaskObj.title}" structural link from ${primaryOldStatusName} to ${targetLaneStatus.toUpperCase()}`);
                persistStateToStorage();
                
                // Native structural movement allocation update routing
                col.querySelector(".task-container").appendChild(structuralDraggingNode);
                refreshMetricsGrid();
            }
        });
    });

    // Trash Drop Handling configurations
    if (trashBin) {
        trashBin.addEventListener("dragover", (e) => {
            e.preventDefault();
            trashBin.classList.add("trash-hovering-glow");
        });
        trashBin.addEventListener("dragleave", () => { trashBin.classList.remove("trash-hovering-glow"); });
        trashBin.addEventListener("drop", (e) => {
            e.preventDefault();
            trashBin.classList.remove("trash-hovering-glow");
            const runningDraggedCard = document.querySelector(".dragging");
            if (runningDraggedCard) {
                purgeTargetedTask(runningDraggedCard.id);
            }
        });
    }
}

// Clear individual task targets completely from memory allocations
function purgeTargetedTask(cardIdStr) {
    const matchedIndex = appState.tasks.findIndex(t => t.id === cardIdStr);
    if (matchedIndex !== -1) {
        const deletedTitleStr = appState.tasks[matchedIndex].title;
        appState.tasks.splice(matchedIndex, 1);
        logSystemChange(`Purged item entity card: "${deletedTitleStr}" completely from engine`);
        persistStateToStorage();
        
        // Remove from DOM dynamically without rewriting layout clusters
        const nodeInDOM = document.getElementById(cardIdStr);
        if (nodeInDOM) nodeInDOM.remove();
        
        refreshMetricsGrid();
        spawnToastMessage("Assignment removed from live workspace memory matrices.", "danger");
    }
}

// High performance metrics calculations 
function refreshMetricsGrid() {
    const total = appState.tasks.length;
    const completed = appState.tasks.filter(t => t.status === "completed").length;
    const pending = total - completed;
    const computeRatio = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById("totalTasks").innerText = total;
    document.getElementById("completedTasks").innerText = completed;
    document.getElementById("pendingTasks").innerText = pending;
    document.getElementById("completionRate").innerText = `${computeRatio}%`;
}

// Generate project cluster breakdowns asynchronously
function populateProjectClusters() {
    const container = document.getElementById("boardsGrid");
    if (!container) return;
    container.innerHTML = "";

    // Structural Map Reducer for collecting board categories
    const projectsMap = {};
    appState.tasks.forEach(t => {
        if (!projectsMap[t.board]) projectsMap[t.board] = { total: 0, completed: 0 };
        projectsMap[t.board].total++;
        if (t.status === "completed") projectsMap[t.board].completed++;
    });

    if (Object.keys(projectsMap).length === 0) {
        container.innerHTML = `<div class="empty-state-fallback-lbl">No distinct project clusters mapped yet. Add a task board category map to initialize.</div>`;
        return;
    }

    Object.entries(projectsMap).forEach(([name, metrics]) => {
        const boardCard = document.createElement("div");
        boardCard.className = "project-cluster-visual-card";
        boardCard.style.cssText = "background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding:20px; border-radius:16px; backdrop-filter:blur(10px);";
        
        const progressionPct = Math.round((metrics.completed / metrics.total) * 100);
        boardCard.innerHTML = `
            <h4 style="margin-bottom:8px; font-size:15px; color:#f8fafc;">📁 ${escapeHTMLMarkup(name)}</h4>
            <p style="font-size:12px; opacity:0.5; margin-bottom:12px;">Fulfillment Metrics: ${metrics.completed}/${metrics.total} Tasks Checked</p>
            <div style="width:100%; height:6px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden;">
                <div style="width:${progressionPct}%; height:100%; background:linear-gradient(90deg, #3b82f6, #9333ea); border-radius:4px;"></div>
            </div>
            <span style="font-size:11px; font-weight:700; opacity:0.8; display:block; text-align:right; margin-top:6px;">${progressionPct}% Done</span>
        `;
        container.appendChild(boardCard);
    });
}

// Render dynamic due timeline data configurations
function populateCalendarLineup() {
    const container = document.getElementById("calendarBox");
    if (!container) return;
    container.innerHTML = "";

    // Chronological date sort operations
    const activeTimelineSortedTasks = [...appState.tasks].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (activeTimelineSortedTasks.length === 0) {
        container.innerHTML = `<div class="empty-state-fallback-lbl">No upcoming deadline actions mapped to database structures.</div>`;
        return;
    }

    activeTimelineSortedTasks.forEach(task => {
        const eventRow = document.createElement("div");
        eventRow.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); margin-bottom:8px; border-radius:10px;";
        eventRow.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                <span class="priority-indicator-bullet" style="width:8px; height:8px; border-radius:50%; background:${task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#10b981'}"></span>
                <span style="font-size:13px; font-weight:600; text-decoration:${task.status === 'completed' ? 'line-through' : 'none'}; opacity:${task.status === 'completed' ? 0.5 : 1}">${escapeHTMLMarkup(task.title)}</span>
            </div>
            <div style="display:flex; align-items:center; gap:15px;">
                <span style="font-size:11px; opacity:0.4; font-family:monospace;">${task.board.toUpperCase()}</span>
                <span style="font-size:12px; font-weight:700; color:#c084fc; background:rgba(168,85,247,0.1); padding:4px 8px; border-radius:6px;">🕒 ${task.date}</span>
            </div>
        `;
        container.appendChild(eventRow);
    });
}

// Track historical operation array logs inside memory pools
function populateActivityFeed() {
    const container = document.getElementById("activityFeed");
    if (!container) return;
    container.innerHTML = "";

    if (appState.activity.length === 0) {
        container.innerHTML = `<div class="empty-state-fallback-lbl">Workspace event recording stream buffer is empty. System actions will display here.</div>`;
        return;
    }

    // Process activity stream records mapping historical layers
    [...appState.activity].reverse().slice(0, 30).forEach(log => {
        const item = document.createElement("div");
        item.style.cssText = "padding:10px 14px; border-bottom:1px solid rgba(255,255,255,0.03); font-size:12px; display:flex; justify-content:between; align-items:center; gap:10px;";
        item.innerHTML = `
            <span style="color:rgba(255,255,255,0.3); font-family:monospace;">[${log.timestamp}]</span>
            <span style="color:#a7f3d0; flex:1;">${escapeHTMLMarkup(log.message)}</span>
        `;
        container.appendChild(item);
    });
}

// Append new logs onto historical buffers dynamically
function logSystemChange(msgString) {
    const time = new Date().toTimeString().split(' ')[0];
    appState.activity.push({ timestamp: time, message: msgString });
    if (appState.activity.length > 100) appState.activity.shift(); // Bound memory footprint
}

/**
 * ARCHITECTURAL FIX 3: ASYNCHRONOUS HIGH-FIDELITY INTERACTIVE BOT (ZIA LIVE ENGINE)
 * Fixes Zia's logic to process asynchronously without compounding event timeouts or dropping frames.
 */
function executeZiaChatPipeline() {
    const inputArea = document.getElementById("botInputField");
    const outputConsole = document.getElementById("botConsoleOutput");
    const indicatorDot = document.getElementById("botStatusDot");
    
    if (!inputArea || !outputConsole) return;
    
    const plainTextRaw = inputArea.value.trim();
    if (!plainTextRaw) return;

    // Set interactive visual status transitions
    indicatorDot.style.background = "#f59e0b";
    indicatorDot.style.boxShadow = "0 0 10px #f59e0b";
    outputConsole.innerText = "Zia is compiling query vectors and processing operations...";

    if (botDebounceTimer) clearTimeout(botDebounceTimer);

    // Asynchronous Execution Simulation Loop 
    botDebounceTimer = setTimeout(() => {
        const queryLower = plainTextRaw.toLowerCase();
        let systemOutputLog = "";

        // NLP Token Command Router
        if (queryLower.startsWith("add ") || queryLower.includes("/board:")) {
            systemOutputLog = handleDirectBotTaskInsertion(plainTextRaw);
        } else if (queryLower.includes("status") || queryLower.includes("metrics") || queryLower.includes("velocity")) {
            const total = appState.tasks.length;
            const finalized = appState.tasks.filter(t => t.status === "completed").length;
            systemOutputLog = `✦ LIVE WORKSPACE DIAGNOSTIC SUMMARY REPORT:\n` +
                              `• Global Task Capacity Load: ${total} tracked entries\n` +
                              `• Current Completed Stack: ${finalized} completed assignments\n` +
                              `• Efficiency Ratio: ${total > 0 ? Math.round((finalized / total) * 100) : 0}%\n\n` +
                              `Zia evaluation: Workspace data configurations display optimized operation parameters. Outstanding sprint elements are within standard operational limits. Let's keep moving! 🚀`;
        } else if (queryLower.includes("clear") || queryLower.includes("purge") || queryLower.includes("wipe")) {
            appState.tasks = [];
            appState.activity = [];
            logSystemChange("Global engine space database wiped via terminal command input execution path");
            persistStateToStorage();
            populateKanbanBoard();
            refreshMetricsGrid();
            populateProjectClusters();
            populateCalendarLineup();
            systemOutputLog = `🌪️ DATABASE RE-INDEX METRICS CLEARED.\nWorkspace has been completely reset. Clean environments established. Everything is down to absolute ground zero structure layers!`;
        } else if (queryLower.includes("hello") || queryLower.includes("hi") || queryLower.includes("hey")) {
            systemOutputLog = `Hey there, ${appState.username}! Zia is here, fully responsive, and maintaining full data persistence links.\n\nNeed an automated speed setup? Type: \n"add [Task Name] /board:[Category] /priority:[High/Medium/Low]"\nand watch me construct the workspace layer mapping live on your board!`;
        } else {
            systemOutputLog = `Zia processing pipeline feedback: Command input unrecognized.\n\nParsed instructions: "${plainTextRaw}"\n\nSupported terminal syntaxes:\n• "add [Action Context] /board:[Project Name] /priority:[High]" to inject kanban objects\n• "status" to calculate live system velocity indices\n• "purge" to execute complete data clears across memory channels`;
        }

        // Return status nodes to standardized states
        indicatorDot.style.background = "#22c55e";
        indicatorDot.style.boxShadow = "0 0 10px #22c55e";
        outputConsole.innerText = systemOutputLog;
        inputArea.value = "";
    }, 450); // Fluid pacing delay matching terminal simulation layouts
}

// Automated parser mapping string strings to operational Kanban card matrices
function handleDirectBotTaskInsertion(inputCommandStr) {
    try {
        let taskTitle = inputCommandStr.substring(4).split("/")[0].trim();
        let boardExtraction = "General Workspace";
        let priorityExtraction = "Medium";

        if (inputCommandStr.includes("/board:")) {
            const boardSection = inputCommandStr.split("/board:")[1].split("/")[0].trim();
            if (boardSection) boardExtraction = boardSection;
        }
        if (inputCommandStr.includes("/priority:")) {
            const prioritySection = inputCommandStr.split("/priority:")[1].split("/")[0].trim();
            if (prioritySection) {
                const normalizedPriority = prioritySection.charAt(0).toUpperCase() + prioritySection.slice(1).toLowerCase();
                if (["High", "Medium", "Low"].includes(normalizedPriority)) priorityExtraction = normalizedPriority;
            }
        }

        if (!taskTitle) return "⚠️ Automated processing script failure: Command lacks clear contextual card identity tracking metadata parameter strings.";

        const botGeneratedObject = {
            id: "card-vector-" + Date.now() + Math.floor(Math.random() * 10),
            title: taskTitle,
            board: boardExtraction,
            date: new Date().toISOString().split('T')[0],
            priority: priorityExtraction,
            status: "backlog",
            tags: ["AI-Injected", "Zia Automata"]
        };

        appState.tasks.push(botGeneratedObject);
        logSystemChange(`Automated parsing event card inserted: "${taskTitle}" within cluster: ${boardExtraction}`);
        persistStateToStorage();
        
        // Dynamic incremental runtime updates to prevent main thread blocking
        populateKanbanBoard();
        refreshMetricsGrid();
        
        return `✦ AUTOMATED TASK GENERATION ENGINE EXECUTION COMPLETE:\n` +
               `• Card Title: "${taskTitle}"\n` +
               `• Allocated Board Mapping: ${boardExtraction}\n` +
               `• Priority Level Assigned: ${priorityExtraction}\n\n` +
               `Successfully compiled parameters and deployed structural frame elements to the Backlog lane array matrix dynamically! ✨`;
    } catch(err) {
        return "⚠️ Critical processing pipeline fault encountered while trying to slice parameters from terminal injection string models.";
    }
}

// Integrated Chart.js data rendering wrapper tracking visualization configurations
function updateAnalyticsVisualization() {
    const renderingContextCanvas = document.getElementById("productivityChart");
    if (!renderingContextCanvas) return;

    const dataMatrix = { backlog: 0, progress: 0, review: 0, completed: 0 };
    appState.tasks.forEach(t => { if (dataMatrix[t.status] !== undefined) dataMatrix[t.status]++; });

    if (chartInstance) {
        chartInstance.destroy();
    }

    // Initialize High Fidelity Visual Canvas Config Mapping
    chartInstance = new Chart(renderingContextCanvas, {
        type: 'bar',
        data: {
            labels: ['BACKLOG STACK', 'IN PROGRESS LINEUP', 'UNDER SEVERE REVIEW', 'COMPLETED MILESTONES'],
            datasets: [{
                label: 'Global Distribution Matrices',
                data: [dataMatrix.backlog, dataMatrix.progress, dataMatrix.review, dataMatrix.completed],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.25)',
                    'rgba(59, 130, 246, 0.25)',
                    'rgba(245, 158, 11, 0.25)',
                    'rgba(16, 185, 129, 0.25)'
                ],
                borderColor: [
                    '#ef4444',
                    '#3b82f6',
                    '#f59e0b',
                    '#10b981'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#f8fafc', font: { family: 'Inter', weight: 600 } } }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.6)' } },
                y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.6)', stepSize: 1 } }
            }
        }
    });
}

// Core Runtime Focus System Configuration Modules
function toggleFocusClock(shouldRunBool) {
    if (shouldRunBool && !appState.stopwatch.running) {
        appState.stopwatch.running = true;
        logSystemChange("Focus engine environment profile tracking session initiated successfully.");
        appState.stopwatch.token = setInterval(() => {
            appState.stopwatch.seconds++;
            document.getElementById("stopwatchDisplay").innerText = formatStopwatchTimestamp(appState.stopwatch.seconds);
        }, 1000);
    } else if (!shouldRunBool && appState.stopwatch.running) {
        appState.stopwatch.running = false;
        clearInterval(appState.stopwatch.token);
        logSystemChange(`Focus engine tracking session suspended at duration: ${formatStopwatchTimestamp(appState.stopwatch.seconds)}`);
    }
}

function resetFocusClock() {
    appState.stopwatch.running = false;
    clearInterval(appState.stopwatch.token);
    appState.stopwatch.seconds = 0;
    document.getElementById("stopwatchDisplay").innerText = "00:00:00";
    logSystemChange("Focus sprint tracking database variables cleared down to absolute zero index arrays.");
}

function formatStopwatchTimestamp(totalSecs) {
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
}

// Sync Global State Config Overrides directly with UI Frame nodes
function syncUIModeAndTheme() {
    document.body.className = ""; // Wipe configurations cleanly
    document.body.classList.add(appState.currentTheme);
    document.body.classList.add(`mode-${appState.currentMode}-view`);
    document.getElementById("currentModeBadge").innerText = `${appState.currentMode.toUpperCase()} PROFILE STATE`;
}

// Native Window HUD Warning notification setups
function spawnToastMessage(msg, type = "success") {
    const holder = document.getElementById("toastNotificationContainer");
    if (!holder) return;

    const banner = document.createElement("div");
    banner.className = `toast-alert-banner alert-${type}`;
    banner.innerText = msg;

    holder.appendChild(banner);

    setTimeout(() => {
        banner.classList.add("dismissing-out");
        banner.addEventListener("animationend", () => { banner.remove(); });
    }, 3500);
}

function startLiveClockEngine() {
    const subtitle = document.getElementById("liveStatusSubtitle");
    if (!subtitle) return;
    setInterval(() => {
        const timestamp = new Date().toLocaleTimeString();
        subtitle.innerText = `System Status Matrix Active • Current Time Vector: ${timestamp} • Engine Nodes Stable`;
    }, 1000);
}

function escapeHTMLMarkup(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
