/* ==========================================================================
   NEXUS BOARD RUNTIME ARCHITECTURE CORE
   ========================================================================== */

// 1. Initial State Infrastructure setup
let appState = {
    username: "Prajwal Shetty S",
    currentMode: "general", // Defaults to combined workspace core view
    currentTheme: "theme-space",
    tasks: [],
    activity: [],
    stopwatch: {
        runtimeSeconds: 0,
        isActive: false
    }
};

let stopwatchIntervalInstance = null;
let historicalProductivityChartInstance = null;
let globallyTrackedActiveDragTargetNode = null;

// File Upload Content Buffer
let structuralBinaryFileContentBuffer = null;
let structuralBinaryFileNameBuffer = "";

// Initialize Core Registry Pipeline Hook
document.addEventListener("DOMContentLoaded", () => {
    initializeWorkspaceStateEngine();
    registerEventHandlers();
    syncApplicationThemeEnvironment(appState.currentTheme);
    renderAll();
    startStopwatchStateRestorationLoop();
});

function initializeWorkspaceStateEngine() {
    const serializedStatePayload = localStorage.getItem("nexus-board-state");
    if (serializedStatePayload) {
        try {
            const parsedState = JSON.parse(serializedStatePayload);
            // Dynamic structure fallbacks
            appState = { ...appState, ...parsedState };
            if (!appState.activity) appState.activity = [];
            if (!appState.tasks) appState.tasks = [];
        } catch (e) {
            console.error("Local storage stream corrupted. Rebuilt default registers.", e);
        }
    }
    document.getElementById("userNameDisplay").innerText = appState.username;
    document.getElementById("greetingHeader").innerText = `Welcome back, ${appState.username}`;
    document.getElementById("mobileHudTitle").innerText = `Nexus Board: ${appState.username}`;
}

function saveApp() {
    localStorage.setItem("nexus-board-state", JSON.stringify(appState));
}

function renderAll() {
    renderKanbanMatrix();
    calculateVelocityStatistics();
    renderProjectClustersPage();
    renderTimelineLineupPage();
    renderProductivityAnalyticsDashboard();
    renderHistoricalLogStream();
}

/* ==========================================================================
   THE GENERAL SPLIT FILTER PROCESSING ENGINE
   ========================================================================== */
function renderKanbanMatrix() {
    const columns = {
        backlog: document.getElementById("backlog"),
        progress: document.getElementById("progress"),
        review: document.getElementById("review"),
        completed: document.getElementById("completed")
    };

    // Clean structural nodes before mapping
    Object.values(columns).forEach(columnNode => {
        if (columnNode) columnNode.innerHTML = "";
    });

    const standardSearchQueryToken = document.getElementById("searchInput").value.toLowerCase().trim();

    appState.tasks.forEach(task => {
        // Query Match filter Check
        const matchesQuery = task.title.toLowerCase().includes(standardSearchQueryToken) || 
                             (task.board && task.board.toLowerCase().includes(standardSearchQueryToken));
        
        if (!matchesQuery) return;

        // PROFILE VIEW FILTER SYSTEM
        let satisfiesModeCondition = false;
        const normalizedBoardName = (task.board || "").toLowerCase().trim();

        if (appState.currentMode === "general") {
            // "General View" logic displays VTU items, personal items, and completely unlabeled fallbacks side-by-side
            satisfiesModeCondition = (normalizedBoardName === "vtu" || 
                                      normalizedBoardName === "personal" || 
                                      normalizedBoardName === "" || 
                                      !task.board);
        } else {
            // Fallback: Default modes execute a strict token lookup matrix matching board tags
            satisfiesModeCondition = (appState.currentMode === normalizedBoardName);
        }

        if (satisfiesModeCondition) {
            const cardDOMElement = buildTaskCardDOMElement(task);
            if (columns[task.status]) {
                columns[task.status].appendChild(cardDOMElement);
            }
        }
    });

    // Rebind Drag events onto newly injected nodes
    attachDragAndDropNodeListeners();
}

function buildTaskCardDOMElement(task) {
    const card = document.createElement("div");
    card.classList.add("task-card");
    card.setAttribute("draggable", "true");
    card.setAttribute("data-id", task.id);

    let priorityBadgeColor = "#22c55e"; // Low priority green
    if (task.priority === "High") priorityBadgeColor = "#ef4444";
    if (task.priority === "Medium") priorityBadgeColor = "#eab308";

    let fileAttachmentBadgeSnippet = "";
    if (task.attachedFileName) {
        fileAttachmentBadgeSnippet = `
            <div class="task-file-link-badge" onclick="triggerFileDownloadStream('${task.id}')" title="Download Asset: ${task.attachedFileName}">
                📎 ${task.attachedFileName}
            </div>`;
    }

    card.innerHTML = `
        <div class="task-priority-ribbon" style="background: ${priorityBadgeColor}"></div>
        <div class="task-title">${escapeHTMLMarkupCharacters(task.title)}</div>
        <div class="task-metadata-row">
            ${task.board ? `<span class="task-board-lbl-tag">${escapeHTMLMarkupCharacters(task.board.toUpperCase())}</span>` : ""}
            ${task.date ? `<span class="task-date-lbl-tag">📅 ${task.date}</span>` : ""}
        </div>
        ${fileAttachmentBadgeSnippet}
    `;
    return card;
}

/* ==========================================================================
   DRAG AND DROP SUB-SYSTEM OVERLAYS
   ========================================================================== */
function attachDragAndDropNodeListeners() {
    const cards = document.querySelectorAll(".task-card");
    const containers = document.querySelectorAll(".task-container");
    const trashZone = document.getElementById("trashDropzone");

    cards.forEach(card => {
        card.addEventListener("dragstart", () => {
            globallyTrackedActiveDragTargetNode = card;
            card.classList.add("dragging");
        });
        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
            globallyTrackedActiveDragTargetNode = null;
            document.querySelectorAll(".board-column").forEach(c => c.classList.remove("drag-hovering-active"));
            if (trashZone) trashZone.classList.remove("trash-hovering-glow");
        });
    });

    containers.forEach(container => {
        const parentColumn = container.closest(".board-column");
        container.addEventListener("dragover", (e) => {
            e.preventDefault();
            if (parentColumn) parentColumn.classList.add("drag-hovering-active");
        });
        container.addEventListener("dragleave", () => {
            if (parentColumn) parentColumn.classList.remove("drag-hovering-active");
        });
        container.addEventListener("drop", () => {
            if (!globallyTrackedActiveDragTargetNode) return;
            const targetTaskId = globallyTrackedActiveDragTargetNode.getAttribute("data-id");
            const destinationStatus = container.id;

            const targetedTaskIndex = appState.tasks.findIndex(t => t.id === targetTaskId);
            if (targetedTaskIndex !== -1 && appState.tasks[targetedTaskIndex].status !== destinationStatus) {
                const legacyStatus = appState.tasks[targetedTaskIndex].status;
                appState.tasks[targetedTaskIndex].status = destinationStatus;
                
                logHistoricalChangeStreamEvent(`Moved task card "${appState.tasks[targetedTaskIndex].title}" from column [${legacyStatus.toUpperCase()}] over to [${destinationStatus.toUpperCase()}].`);
                saveApp();
                renderAll();
            }
        });
    });

    if (trashZone) {
        trashZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            trashZone.classList.add("trash-hovering-glow");
        });
        trashZone.addEventListener("dragleave", () => {
            trashZone.classList.remove("trash-hovering-glow");
        });
        trashZone.addEventListener("drop", () => {
            if (!globallyTrackedActiveDragTargetNode) return;
            const targetTaskId = globallyTrackedActiveDragTargetNode.getAttribute("data-id");
            const taskMatch = appState.tasks.find(t => t.id === targetTaskId);
            
            if (taskMatch) {
                appState.tasks = appState.tasks.filter(t => t.id !== targetTaskId);
                logHistoricalChangeStreamEvent(`Purged task card entry "${taskMatch.title}" permanently via vault layout drop actions.`);
                spawnToastNotificationBanner("Document wiped from registry.", "danger");
                saveApp();
                renderAll();
            }
        });
    }
}

/* ==========================================================================
   EVENT SUITE HANDLER ROUTINES
   ========================================================================== */
function registerEventHandlers() {
    // Top Bar Search Actions
    document.getElementById("searchInput").addEventListener("input", renderKanbanMatrix);

    // Modal Control Management Switches
    const taskModal = document.getElementById("taskModal");
    document.getElementById("newTaskBtn").addEventListener("click", () => taskModal.classList.remove("hidden"));
    document.getElementById("mobileNewTaskBtn").addEventListener("click", () => taskModal.classList.remove("hidden"));
    document.getElementById("closeModal").addEventListener("click", () => taskModal.classList.add("hidden"));

    // Handle File upload mapping inside creation frame buffers
    const localFileInputField = document.getElementById("modalFileInput");
    const localFileUploadLabelText = document.getElementById("fileUploadStatus");
    if (localFileInputField) {
        localFileInputField.addEventListener("change", (e) => {
            const activeTargetFile = e.target.files[0];
            if (activeTargetFile) {
                structuralBinaryFileNameBuffer = activeTargetFile.name;
                const dynamicFileStreamReader = new FileReader();
                dynamicFileStreamReader.onload = function(evt) {
                    structuralBinaryFileContentBuffer = evt.target.result;
                    localFileUploadLabelText.innerText = `Linked: ${activeTargetFile.name} (${Math.round(activeTargetFile.size/1024)} KB)`;
                };
                dynamicFileStreamReader.readAsDataURL(activeTargetFile);
            }
        });
    }

    // Task Submission Engine Pipeline Execution
    document.getElementById("createTaskBtn").addEventListener("click", appendNewTaskEntryFromModalStructure);

    // Profile Context Selection Configuration Strip Switches
    document.querySelectorAll(".mode-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
            button.classList.add("active");
            
            const selectedMode = button.getAttribute("data-mode");
            appState.currentMode = selectedMode;
            
            const currentBadgeNode = document.getElementById("currentModeBadge");
            if (currentBadgeNode) currentBadgeNode.innerText = `${selectedMode.toUpperCase()} ACTIVE`;
            
            // Apply unique global engine style sheets overrides
            document.body.className = ""; // Wipe active overrides 
            document.body.classList.add(`theme-${appState.currentTheme || "space"}`);
            
            if (selectedMode === "zen") document.body.classList.add("mode-zen-view");
            if (selectedMode === "dev") document.body.classList.add("mode-dev-view");
            if (selectedMode === "creative") document.body.classList.add("mode-creative-view");
            if (selectedMode === "cyberpunk") document.body.classList.add("mode-cyberpunk-view");

            saveApp();
            renderAll();
            spawnToastNotificationBanner(`Switched target filter engine pipeline mode context to: ${selectedMode.toUpperCase()}`, "success");
        });
    });

    // Username Change Mechanics Trigger
    document.getElementById("editNameBtn").addEventListener("click", () => {
        const structuralNamePromptInputResult = prompt("Modify registered engineering operator name identification:", appState.username);
        if (structuralNamePromptInputResult && structuralNamePromptInputResult.trim()) {
            appState.username = structuralNamePromptInputResult.trim();
            document.getElementById("userNameDisplay").innerText = appState.username;
            document.getElementById("greetingHeader").innerText = `Welcome back, ${appState.username}`;
            document.getElementById("mobileHudTitle").innerText = `Nexus Board: ${appState.username}`;
            logHistoricalChangeStreamEvent(`Modified workspace owner identifier to [${appState.username}].`);
            saveApp();
        }
    });

    // Sidebar Page Tab Routing Matrices
    document.querySelectorAll(".sidebar-menu .menu-item[data-page]").forEach(tabBtn => {
        tabBtn.addEventListener("click", () => {
            document.querySelectorAll(".sidebar-menu .menu-item[data-page]").forEach(b => b.classList.remove("active"));
            tabBtn.classList.add("active");
            
            const targetedPageId = tabBtn.getAttribute("data-page");
            document.querySelectorAll(".main-content .page").forEach(pageNode => pageNode.classList.remove("active-page"));
            
            const displayTargetPage = document.getElementById(`${targetedPageId}-page`);
            if (displayTargetPage) displayTargetPage.classList.add("active-page");
        });
    });

    // Theme Switch Selection Node Listeners
    document.querySelectorAll(".theme-card").forEach(themeCardNode => {
        themeCardNode.addEventListener("click", () => {
            const targetedThemeKeyword = themeCardNode.getAttribute("data-theme");
            appState.currentTheme = targetedThemeKeyword;
            syncApplicationThemeEnvironment(targetedThemeKeyword);
            saveApp();
            spawnToastNotificationBanner(`Environment layout blueprint modified to alternative engine skin context.`, "success");
        });
    });

    // Mobile Responsive Overlay toggles
    const sidebarElementNode = document.getElementById("sidebarNode");
    document.getElementById("menuOpenBtn").addEventListener("click", () => sidebarElementNode.style.transform = "translateX(0)");
    document.getElementById("menuCloseBtn").addEventListener("click", () => sidebarElementNode.style.transform = "translateX(-100%)");

    // Backup Export Data Stream Handling
    document.getElementById("exportStateBtn").addEventListener("click", () => {
        const rawJsonStringDataStream = JSON.stringify(appState, null, 4);
        const dynamicBinaryBlobDataHolder = new Blob([rawJsonStringDataStream], { type: "application/json" });
        const virtualAnchorDownloadLinkElement = document.createElement("a");
        virtualAnchorDownloadLinkElement.href = URL.createObjectURL(dynamicBinaryBlobDataHolder);
        virtualAnchorDownloadLinkElement.download = `NEXUS-BOARD-BACKUP-${new Date().toISOString().slice(0,10)}.json`;
        virtualAnchorDownloadLinkElement.click();
        spawnToastNotificationBanner("Configuration blueprint backup exported cleanly.", "success");
    });

    // Backup Import Data Stream Parsing
    document.getElementById("importStateInput").addEventListener("change", (e) => {
        const targetUploadMetadataDescriptor = e.target.files[0];
        if (!targetUploadMetadataDescriptor) return;
        
        const runtimeBlobStreamReader = new FileReader();
        runtimeBlobStreamReader.onload = function(evt) {
            try {
                const structuredImportedDataStateObject = JSON.parse(evt.target.result);
                if (structuredImportedDataStateObject.tasks && structuredImportedDataStateObject.username) {
                    appState = structuredImportedDataStateObject;
                    saveApp();
                    window.location.reload();
                } else {
                    spawnToastNotificationBanner("Invalid system profile backup structural blueprint.", "danger");
                }
            } catch (err) {
                spawnToastNotificationBanner("File payload parsing corruption error.", "danger");
            }
        };
        runtimeBlobStreamReader.readAsText(targetUploadMetadataDescriptor);
    });

    // Stopwatch Controls Hookups
    document.getElementById("swStartBtn").addEventListener("click", startFocusTimerSprintEngine);
    document.getElementById("swPauseBtn").addEventListener("click", pauseFocusTimerSprintEngine);
    document.getElementById("swResetBtn").addEventListener("click", resetFocusTimerSprintEngine);

    // Zia Chat Trigger Entry Execution Nodes
    document.getElementById("submitBotQueryBtn").addEventListener("click", executeZiaCommandPipelineProcessor);
    document.getElementById("botInputField").addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            executeZiaCommandPipelineProcessor();
        }
    });
}

function syncApplicationThemeEnvironment(themeClassName) {
    // Preserve custom view classes while modifying base background matrices
    const workingClassList = Array.from(document.body.classList).filter(c => c.startsWith("mode-"));
    document.body.className = "";
    document.body.classList.add(themeClassName);
    workingClassList.forEach(c => document.body.classList.add(c));
}

/* ==========================================================================
   TASK HANDLING & CREATION METHODS
   ========================================================================== */
function appendNewTaskEntryFromModalStructure() {
    const titleVal = document.getElementById("taskInput").value.trim();
    const tagsVal = document.getElementById("tagsInput").value.trim();
    const boardVal = document.getElementById("boardInput").value.trim() || "general";
    const dateVal = document.getElementById("dateInput").value;
    const priorityVal = document.getElementById("priorityInput").value;

    if (!titleVal) {
        spawnToastNotificationBanner("Task identifier title string cannot remain blank.", "danger");
        return;
    }

    const uniqueGeneratedTaskStringId = "task-" + Date.now() + "-" + Math.floor(Math.random()*1000);
    const splitProcessedTagsArray = tagsVal ? tagsVal.split(",").map(t => t.trim()).filter(t => t.length > 0) : ["General Workspace"];

    const builtTaskObjectSchema = {
        id: uniqueGeneratedTaskStringId,
        title: titleVal,
        tags: splitProcessedTagsArray,
        board: boardVal,
        date: dateVal || null,
        priority: priorityVal,
        status: "backlog",
        attachedFileName: structuralBinaryFileNameBuffer || null,
        attachedFileDataStream: structuralBinaryFileContentBuffer || null
    };

    appState.tasks.push(builtTaskObjectSchema);
    logHistoricalChangeStreamEvent(`Created new task entry card [${titleVal.toUpperCase()}] targeted toward cluster sector [${boardVal.toUpperCase()}].`);
    
    saveApp();
    renderAll();

    // Re-initialize ingestion form fields
    document.getElementById("taskInput").value = "";
    document.getElementById("tagsInput").value = "";
    document.getElementById("boardInput").value = "";
    document.getElementById("dateInput").value = "";
    document.getElementById("modalFileInput").value = "";
    document.getElementById("fileUploadStatus").innerText = "No local files linked.";
    
    structuralBinaryFileContentBuffer = null;
    structuralBinaryFileNameBuffer = "";

    document.getElementById("taskModal").classList.add("hidden");
    spawnToastNotificationBanner("Saved directly to workspace database matrix!", "success");
}

function triggerFileDownloadStream(taskId) {
    const taskMatch = appState.tasks.find(t => t.id === taskId);
    if (taskMatch && taskMatch.attachedFileDataStream) {
        const simulatedAnchorDownloadElement = document.createElement("a");
        simulatedAnchorDownloadElement.href = taskMatch.attachedFileDataStream;
        simulatedAnchorDownloadElement.download = taskMatch.attachedFileName;
        simulatedAnchorDownloadElement.click();
        spawnToastNotificationBanner("Downloading attached document asset asset data flow stream.", "success");
    } else {
        spawnToastNotificationBanner("File reference missing or corrupted.", "danger");
    }
}

/* ==========================================================================
   STATISTICAL ENGINE COMPUTATION ROUTINES
   ========================================================================== */
function calculateVelocityStatistics() {
    const totals = appState.tasks.length;
    const visibilityQueryToken = document.getElementById("searchInput").value.toLowerCase().trim();

    // Profile Scope Specific Filter Logic matching Kanban loops
    const scopeFilteredTasksList = appState.tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(visibilityQueryToken) || 
                              (task.board && task.board.toLowerCase().includes(visibilityQueryToken));
        if (!matchesSearch) return false;

        const normalizedBoardName = (task.board || "").toLowerCase().trim();
        if (appState.currentMode === "general") {
            return (normalizedBoardName === "vtu" || normalizedBoardName === "personal" || normalizedBoardName === "" || !task.board);
        }
        return (appState.currentMode === normalizedBoardName);
    });

    const contextTotals = scopeFilteredTasksList.length;
    const completedCount = scopeFilteredTasksList.filter(t => t.status === "completed").length;
    const pendingCount = contextTotals - completedCount;
    const dynamicRatePercentage = contextTotals > 0 ? Math.round((completedCount / contextTotals) * 100) : 0;

    document.getElementById("totalTasks").innerText = contextTotals;
    document.getElementById("completedTasks").innerText = completedCount;
    document.getElementById("pendingTasks").innerText = pendingCount;
    document.getElementById("completionRate").innerText = `${dynamicRatePercentage}%`;
}

/* ==========================================================================
   SUB-PAGE RENDERING INTERFACES (CLUSTERS, LINEUPS, CHARTS)
   ========================================================================== */
function renderProjectClustersPage() {
    const clustersGridNode = document.getElementById("boardsGrid");
    if (!clustersGridNode) return;
    clustersGridNode.innerHTML = "";

    // Extract dynamic map layout properties from active boards references
    const dynamicClusterMap = {};
    appState.tasks.forEach(task => {
        const rawBoardIdentifier = task.board || "Unassigned General Workspace";
        if (!dynamicClusterMap[rawBoardIdentifier]) dynamicClusterMap[rawBoardIdentifier] = [];
        dynamicClusterMap[rawBoardIdentifier].push(task);
    });

    if (Object.keys(dynamicClusterMap).length === 0) {
        clustersGridNode.innerHTML = `<div class="empty-state-card-lbl">No dynamic project clusters populated inside structural logs yet. Create cards to automatically compile views.</div>`;
        return;
    }

    Object.entries(dynamicClusterMap).forEach(([clusterName, tasksInCluster]) => {
        const totalClusterCardsCount = tasksInCluster.length;
        const completeClusterCardsCount = tasksInCluster.filter(t => t.status === "completed").length;
        const structuralRatePercentage = Math.round((completeClusterCardsCount / totalClusterCardsCount) * 100);

        const clusterCardNode = document.createElement("div");
        clusterCardNode.classList.add("board-summary-card");
        clusterCardNode.innerHTML = `
            <h3 class="cluster-card-title-lbl">${escapeHTMLMarkupCharacters(clusterName.toUpperCase())}</h3>
            <p class="cluster-card-stats-lbl">Total Tasks Logged: <strong>${totalClusterCardsCount}</strong> (${completeClusterCardsCount} completed)</p>
            <div class="cluster-progress-track-bar-container">
                <div class="cluster-progress-fill-indicator" style="width: ${structuralRatePercentage}%"></div>
            </div>
            <div style="font-size:11px; text-align:right; margin-top:4px; opacity:0.5; font-weight:700;">${structuralRatePercentage}% Complete</div>
        `;
        clustersGridNode.appendChild(clusterCardNode);
    });
}

function renderTimelineLineupPage() {
    const calendarBoxNode = document.getElementById("calendarBox");
    if (!calendarBoxNode) return;
    calendarBoxNode.innerHTML = "";

    // Extract dated structural variables, sorting chronologically 
    const timelineSortedTasks = appState.tasks.filter(t => t.date !== null && t.date !== "").sort((first, second) => new Date(first.date) - new Date(second.date));

    if (timelineSortedTasks.length === 0) {
        calendarBoxNode.innerHTML = `<div class="empty-state-card-lbl">No scheduled due date references identified inside storage registries. Linked tasks appear here.</div>`;
        return;
    }

    timelineSortedTasks.forEach(task => {
        const timelineItemRowNode = document.createElement("div");
        timelineItemRowNode.classList.add("calendar-line-item");
        timelineItemRowNode.innerHTML = `
            <div class="lineup-date-badge">📅 ${task.date}</div>
            <div class="lineup-task-details">
                <span class="lineup-task-title-txt">${escapeHTMLMarkupCharacters(task.title)}</span>
                <span class="lineup-board-badge">${escapeHTMLMarkupCharacters((task.board || "GENERAL").toUpperCase())}</span>
            </div>
            <div class="lineup-status-badge status-${task.status}">${task.status.toUpperCase()}</div>
        `;
        calendarBoxNode.appendChild(timelineItemRowNode);
    });
}

function renderProductivityAnalyticsDashboard() {
    const canvasNodeElement = document.getElementById("productivityChart");
    if (!canvasNodeElement) return;

    const columnStatusIdentifiers = ["backlog", "progress", "review", "completed"];
    const quantitativeDatasetValues = columnStatusIdentifiers.map(statusKey => appState.tasks.filter(t => t.status === statusKey).length);

    if (historicalProductivityChartInstance) {
        historicalProductivityChartInstance.destroy();
    }

    const totalActiveVolume = appState.tasks.length;
    if (totalActiveVolume === 0) {
        const chartWrapperParent = canvasNodeElement.parentNode;
        if(chartWrapperParent && !document.getElementById("emptyChartNotice")) {
            const warningStub = document.createElement("p");
            warningStub.id = "emptyChartNotice";
            warningStub.innerText = "Insufficient database profile assets to render chart visuals.";
            warningStub.style.cssText = "font-size: 13px; text-align: center; opacity: 0.5; padding: 40px 0;";
            chartWrapperParent.appendChild(warningStub);
        }
        return;
    } else {
        const oldNotice = document.getElementById("emptyChartNotice");
        if (oldNotice) oldNotice.remove();
    }

    const canvasRenderingContext = canvasNodeElement.getContext("2d");
    historicalProductivityChartInstance = new Chart(canvasRenderingContext, {
        type: "bar",
        data: {
            labels: ["BACKLOG INGESTION", "ACTIVE IN-PROGRESS", "UNDER REGULATORY REVIEW", "COMPLETED VELOCITY"],
            datasets: [{
                label: "Registered Tasks Volume Volume",
                data: quantitativeDatasetValues,
                backgroundColor: [
                    "rgba(96, 165, 250, 0.25)",  // Blue
                    "rgba(234, 179, 8, 0.25)",   // Yellow
                    "rgba(168, 85, 247, 0.25)",  // Purple
                    "rgba(16, 185, 129, 0.25)"   // Green
                ],
                borderColor: [
                    "#60a5fa", "#eab308", "#a855f7", "#10b981"
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "rgba(255, 255, 255, 0.6)", stepSize: 1 }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: "rgba(255, 255, 255, 0.6)", font: { size: 10, weight: "600" } }
                }
            }
        }
    });
}

function renderHistoricalLogStream() {
    const historyFeedNode = document.getElementById("activityFeed");
    if (!historyFeedNode) return;
    historyFeedNode.innerHTML = "";

    if (appState.activity.length === 0) {
        historyFeedNode.innerHTML = `<div class="empty-state-card-lbl">No historical entries written down to systemic log files yet.</div>`;
        return;
    }

    // Render chronological records in reverse order
    [...appState.activity].reverse().forEach(logItem => {
        const itemNode = document.createElement("div");
        itemNode.classList.add("activity-log-line");
        itemNode.innerHTML = `
            <span class="log-timestamp-lbl">[${logItem.timestamp}]</span>
            <span class="log-message-body-txt">${escapeHTMLMarkupCharacters(logItem.message)}</span>
        `;
        historyFeedNode.appendChild(itemNode);
    });
}

function logHistoricalChangeStreamEvent(messageString) {
    const formatTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    appState.activity.push({
        timestamp: formatTimestamp,
        message: messageString
    });
    // Truncate stack log registers dynamically to prevent excessive allocation scales
    if (appState.activity.length > 100) appState.activity.shift();
}

/* ==========================================================================
   FOCUS SPRINT TIMER MOTOR REGISTRY ENGINE
   ========================================================================== */
function startStopwatchStateRestorationLoop() {
    updateStopwatchVisualDisplayFrame();
    if (appState.stopwatch.isActive) {
        const historicalCheckpointTime = localStorage.getItem("nexus-stopwatch-exit-timestamp");
        if (historicalCheckpointTime) {
            const timeDifferenceDeltaSeconds = Math.floor((Date.now() - parseInt(historicalCheckpointTime)) / 1000);
            if (timeDifferenceDeltaSeconds > 0) {
                appState.stopwatch.runtimeSeconds += timeDifferenceDeltaSeconds;
            }
        }
        // Restart ticking routine interval loops safely
        stopwatchIntervalInstance = setInterval(() => {
            appState.stopwatch.runtimeSeconds++;
            updateStopwatchVisualDisplayFrame();
            localStorage.setItem("nexus-stopwatch-exit-timestamp", Date.now().toString());
        }, 1000);
    }
}

function startFocusTimerSprintEngine() {
    if (appState.stopwatch.isActive) return;
    appState.stopwatch.isActive = true;
    logHistoricalChangeStreamEvent("Initiated focus sprint interval countdown engine sequence.");
    saveApp();
    
    stopwatchIntervalInstance = setInterval(() => {
        appState.stopwatch.runtimeSeconds++;
        updateStopwatchVisualDisplayFrame();
        localStorage.setItem("nexus-stopwatch-exit-timestamp", Date.now().toString());
    }, 1000);
    spawnToastNotificationBanner("Focus sprint engine active. Happy hacking!", "success");
}

function pauseFocusTimerSprintEngine() {
    if (!appState.stopwatch.isActive) return;
    appState.stopwatch.isActive = false;
    clearInterval(stopwatchIntervalInstance);
    logHistoricalChangeStreamEvent(`Paused focus timer countdown sequence at checkpoint marker [${document.getElementById("stopwatchDisplay").innerText}].`);
    saveApp();
    spawnToastNotificationBanner("Focus sprint interval split paused.", "danger");
}

function resetFocusTimerSprintEngine() {
    appState.stopwatch.isActive = false;
    appState.stopwatch.runtimeSeconds = 0;
    clearInterval(stopwatchIntervalInstance);
    updateStopwatchVisualDisplayFrame();
    localStorage.removeItem("nexus-stopwatch-exit-timestamp");
    logHistoricalChangeStreamEvent("Reset structural focus sprint cycle metric registers to absolute zero.");
    saveApp();
    spawnToastNotificationBanner("Focus timer registers reset to absolute zero.", "danger");
}

function updateStopwatchVisualDisplayFrame() {
    const totalSeconds = appState.stopwatch.runtimeSeconds;
    const computedHours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const computedMinutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const computedSeconds = (totalSeconds % 60).toString().padStart(2, "0");
    
    const displayNode = document.getElementById("stopwatchDisplay");
    if (displayNode) displayNode.innerText = `${computedHours}:${computedMinutes}:${computedSeconds}`;
}

/* ==========================================================================
   ZIA AI BOT DIRECTIVE COMMAND INTERPRETER TERMINAL PIPELINE
   ========================================================================== */
function executeZiaCommandPipelineProcessor() {
    const botInputField = document.getElementById("botInputField");
    const feedbackConsolePreNode = document.getElementById("botConsoleOutput");
    const statusDotNode = document.getElementById("botStatusDot");

    const rawInputStringToken = botInputField.value.trim();
    if (!rawInputStringToken) return;

    if (statusDotNode) statusDotNode.style.background = "#eab308"; // Working yellow status animation
    feedbackConsolePreNode.innerText = "Zia is compiling command sequence vectors...";

    setTimeout(() => {
        if (statusDotNode) statusDotNode.style.background = "#a855f7"; // Reset to default cozy purple

        const standardizedTokenInput = rawInputStringToken.toLowerCase();
        let evaluatedBotFeedbackLogString = "";

        if (standardizedTokenInput.startsWith("add ")) {
            // Directive Parsing Logic Format example: add Complete assignment /board:vtu /priority:High
            const rawPayloadString = rawInputStringToken.substring(4);
            
            let targetBoardKeyword = "general";
            let targetPriorityKeyword = "Medium";
            let purifiedTaskTitleString = rawPayloadString;

            if (purifiedTaskTitleString.includes("/board:")) {
                const pieces = purifiedTaskTitleString.split("/board:");
                const boardTokenPiece = pieces[1].split(" ")[0];
                targetBoardKeyword = boardTokenPiece.trim();
                purifiedTaskTitleString = purifiedTaskTitleString.replace(`/board:${boardTokenPiece}`, "");
            }

            if (purifiedTaskTitleString.includes("/priority:")) {
                const pieces = purifiedTaskTitleString.split("/priority:");
                const priorityTokenPiece = pieces[1].split(" ")[0];
                targetPriorityKeyword = priorityTokenPiece.trim();
                // Standardize casing to match enum requirements
                if (targetPriorityKeyword.toLowerCase() === "high") targetPriorityKeyword = "High";
                if (targetPriorityKeyword.toLowerCase() === "medium") targetPriorityKeyword = "Medium";
                if (targetPriorityKeyword.toLowerCase() === "low") targetPriorityKeyword = "Low";
                purifiedTaskTitleString = purifiedTaskTitleString.replace(`/priority:${priorityTokenPiece}`, "");
            }

            purifiedTaskTitleString = purifiedTaskTitleString.replace(/\s+/g, " ").trim();

            const uniqueTaskId = "task-" + Date.now() + "-" + Math.floor(Math.random()*100);
            const automatedTaskSchema = {
                id: uniqueTaskId,
                title: purifiedTaskTitleString,
                tags: ["Zia Quick Ingestion"],
                board: targetBoardKeyword,
                date: new Date().toISOString().slice(0, 10),
                priority: targetPriorityKeyword,
                status: "backlog",
                attachedFileName: null,
                attachedFileDataStream: null
            };

            appState.tasks.push(automatedTaskSchema);
            logHistoricalChangeStreamEvent(`Zia automated ingestion script compiled task card "${purifiedTaskTitleString}" inside segment [${targetBoardKeyword.toUpperCase()}].`);
            saveApp();
            renderAll();

            evaluatedBotFeedbackLogString = `✦ BOOM! Zia has systematically ingested that task entry right into the system engine layout: \n\n` +
                                             `• Task Identifier: "${purifiedTaskTitleString}"\n` +
                                             `• Cluster Core Segment Target: "${targetBoardKeyword.toUpperCase()}"\n` +
                                             `• Priority Level Matrix Layer: ${targetPriorityKeyword}\n\n` +
                                             `Check the backlog column, boss! Let's get to work! 🚀`;
            spawnToastNotificationBanner("Task injected via Zia chat.", "success");
        }
        else if (standardizedTokenInput.includes("hello") || standardizedTokenInput.includes("hi") || standardizedTokenInput.includes("hey")) {
            evaluatedBotFeedbackLogString = `Hey there, boss! Zia is loaded up and fully optimized to help you coordinate this dev sprint. \n\nYou can ask me to write a task for you using explicit inline directives like:\n"add Finish physics engine sandbox integration /board:dev /priority:High"`;
        }
        else if (standardizedTokenInput.includes("status") || standardizedTokenInput.includes("metrics") || standardizedTokenInput.includes("velocity")) {
            const totalsCount = appState.tasks.length;
            const completeCount = appState.tasks.filter(t => t.status === "completed").length;
            
            evaluatedBotFeedbackLogString = `✦ COMPILED WORKSPACE METRIC LOG MATRIX:\n\n` +
                                             `• Aggregate Ingested Task Cards Volume: ${totalsCount} items\n` +
                                             `• Milestones Met: ${completeCount} completed cards\n` +
                                             `• Display Mode Configuration: ${appState.currentMode.toUpperCase()}\n\n` +
                                             `You are running an incredibly tight workflow today. Let's clear out a few more backlog items!`;
        }
        else if (standardizedTokenInput.includes("clear") || standardizedTokenInput.includes("purge") || standardizedTokenInput.includes("wipe")) {
            appState.tasks = []; 
            appState.activity = []; 
            saveApp(); 
            renderAll();
            evaluatedBotFeedbackLogString = `✦ COMPLETE DATABASE PURGE EXECUTION COMPLETE.\n \nEverything is gone, clean slates across all vectors! Let's start building the next generation engine layout from ground zero.  🌪️✨ `;
            spawnToastNotificationBanner("Workspace entirely purged.", "danger");
        }
        else {
            evaluatedBotFeedbackLogString = `Hmm, Zia is thinking... I didn't quite catch that exact directive pattern! \nYou can say things like:\n• "hi" or "hello" to check in on me.\n• "add [Task name] /board:[Name] /priority:[High]" to quickly throw cards on your board.\n• "status" to pull instant workspace velocity statistics.`;
        }
        
        feedbackConsolePreNode.innerText = evaluatedBotFeedbackLogString;
        botInputField.value = "";
    }, 300);
}

/* ==========================================================================
   UTILITY HELPER INTERFACES
   ========================================================================== */
function spawnToastNotificationBanner(message, type = "success") {
    const toastContainer = document.getElementById("toastNotificationContainer");
    if (!toastContainer) return;

    const banner = document.createElement("div");
    banner.classList.add("toast-alert-banner");
    if (type === "danger") banner.classList.add("alert-danger");
    if (type === "success") banner.classList.add("alert-success");

    banner.innerText = message;
    toastContainer.appendChild(banner);

    // Fade and self destruction timelines 
    setTimeout(() => {
        banner.classList.add("dismissing-out");
        banner.addEventListener("animationend", () => banner.remove());
    }, 4000);
}

function escapeHTMLMarkupCharacters(rawString) {
    if (!rawString) return "";
    return rawString
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
