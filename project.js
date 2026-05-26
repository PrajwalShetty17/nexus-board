/* ==========================================================================
   NEXUS BOARD RUNTIME INSTANCE — VERSION 11.0 (ZIA ALIVE UPGRADE)
   ========================================================================== */

let appState = JSON.parse(localStorage.getItem("nexus-board-state")) || {
    username: "Prajwal Shetty S",
    tasks: [],
    theme: "theme-space",
    activity: [],
    currentMode: "focus",
    fileStorageMock: {} 
};

/* --- DOM INITIALIZATIONS & ANCHOR CACHING --- */
const modal = document.getElementById("taskModal");
const newTaskBtn = document.getElementById("newTaskBtn");
const mobileNewTaskBtn = document.getElementById("mobileNewTaskBtn");
const closeModal = document.getElementById("closeModal");
const createTaskBtn = document.getElementById("createTaskBtn");

const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const dateInput = document.getElementById("dateInput");
const boardInput = document.getElementById("boardInput");
const tagsInput = document.getElementById("tagsInput");
const modalFileInput = document.getElementById("modalFileInput");
const fileUploadStatus = document.getElementById("fileUploadStatus");

const sidebarNode = document.getElementById("sidebarNode");
const menuOpenBtn = document.getElementById("menuOpenBtn");
const menuCloseBtn = document.getElementById("menuCloseBtn");

const botInputField = document.getElementById("botInputField");
const submitBotQueryBtn = document.getElementById("submitBotQueryBtn");

/* Profile Components */
const userNameDisplay = document.getElementById("userNameDisplay");
const editNameBtn = document.getElementById("editNameBtn");
const greetingHeader = document.getElementById("greetingHeader");
const mobileHudTitle = document.getElementById("mobileHudTitle");

/* Infrastructure Anchors */
const exportStateBtn = document.getElementById("exportStateBtn");
const importStateInput = document.getElementById("importStateInput");
const trashDropzone = document.getElementById("trashDropzone");

let contextAttachedFileBuffer = null;
let stopwatchIntervalId = null;
let elapsedStopwatchMilliseconds = 0;
let applicationSessionBootTime = Date.now();
const THRESHOLD_HEALTH_REMINDER_MS = 60000; // 1 minute warning check

/* --- CHARMING CHAT DICTIONARIES FOR ZIA --- */
const ZIA_FLAVORS = {
    greetings: [
        "Hey boss! Zia here. Ready to absolutely crush some milestones today? Let's make it look easy! 🚀✨",
        "Prajwal! My favorite developer. Tell me what we're tackling next, and I'll map out the board tracks! 🧠💻",
        "Oh, perfect timing! I was just organizing the cards. What magnificent thing are we creating today? 🌟",
        "Nexus Board is firing on all cylinders! Lay some work parameters on me, let's build something epic! 🛠️🔥"
    ],
    compliments: [
        "You're making incredible progress. Seriously, look at this velocity! 📈",
        "Boom! Another card cleared. You're an absolute machine, you know that? 🏆",
        "Clean architecture, fast workflow... working with you is a developer's dream. 💻✨",
        "Outstanding move! Let's keep this momentum rolling into the next sprint! 🌪️"
    ],
    pokes: [
        "Psst... you still there? Don't leave me hanging, let's smash some goals! 👀",
        "Fun fact: Your codebase runs perfectly because we make an unstoppable team. What's next? 🤝",
        "Just checked the charts—your productivity curve looks glorious today. Keep it up! ⚡",
        "Zia is waiting for your next command line directive. Ready when you are, boss! 👑"
    ]
};

/* --- CORE CONTEXT BOOT LOOPS --- */
document.addEventListener("DOMContentLoaded", () => {
    if (modal) modal.classList.add("hidden");

    synchronizeProfileNamesAcrossWorkspace();
    document.body.className = appState.theme;
    applySystemModeClass(appState.currentMode || "focus");
    
    renderAll();
    bindFunctionalEvents();
    initializeStopwatchWidgetEngine();
    initializeActiveHealthCheckScheduler();
    initializeTrueDragAndDropPipeline();
    
    spawnToastNotification("Nexus Board Engine initialized successfully.", "success");
    rotateZiaGreeting();
});

/* --- LIVE TOAST SYSTEM BANNER --- */
function spawnToastNotification(messageText, styleVariant = "info") {
    const toastContainer = document.getElementById("toastNotificationContainer");
    if (!toastContainer) return;

    const alertBanner = document.createElement("div");
    alertBanner.className = `toast-alert-banner alert-${styleVariant}`;
    alertBanner.innerText = messageText;

    toastContainer.appendChild(alertBanner);

    setTimeout(() => {
        alertBanner.classList.add("dismissing-out");
        alertBanner.addEventListener("animationend", () => { alertBanner.remove(); });
    }, 4000);
}

function rotateZiaGreeting() {
    const outputConsole = document.getElementById("botConsoleOutput");
    if (!outputConsole) return;
    const randomGreet = ZIA_FLAVORS.greetings[Math.floor(Math.random() * ZIA_FLAVORS.greetings.length)];
    outputConsole.innerText = randomGreet;
}

function synchronizeProfileNamesAcrossWorkspace() {
    const activeName = appState.username || "Prajwal Shetty S";
    if (userNameDisplay) userNameDisplay.innerText = activeName;
    if (greetingHeader) greetingHeader.innerText = `Welcome back, ${activeName}`;
    if (mobileHudTitle) mobileHudTitle.innerText = `Nexus Board: ${activeName}`;
    
    const avatarBadge = document.querySelector(".profile-avatar");
    if (avatarBadge) {
        const structuralNameTokens = activeName.split(" ");
        avatarBadge.innerText = structuralNameTokens.length >= 2 
            ? (structuralNameTokens[0][0] + structuralNameTokens[1][0]).toUpperCase()
            : structuralNameTokens[0].substring(0, 2).toUpperCase();
    }
}

function bindFunctionalEvents() {
    if (newTaskBtn) newTaskBtn.addEventListener("click", () => modal.classList.remove("hidden"));
    if (mobileNewTaskBtn) mobileNewTaskBtn.addEventListener("click", () => modal.classList.remove("hidden"));
    if (closeModal) closeModal.addEventListener("click", () => modal.classList.add("hidden"));

    /* EXPORT STATE HANDLER */
    if (exportStateBtn) {
        exportStateBtn.addEventListener("click", () => {
            try {
                const stateDataString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState));
                const temporaryDownloadAnchor = document.createElement('a');
                temporaryDownloadAnchor.setAttribute("href", stateDataString);
                temporaryDownloadAnchor.setAttribute("download", `nexus-board-backup-${new Date().toISOString().split('T')[0]}.json`);
                document.body.appendChild(temporaryDownloadAnchor);
                temporaryDownloadAnchor.click();
                temporaryDownloadAnchor.remove();
                spawnToastNotification("Nexus Board profile snapshot downloaded successfully.", "success");
            } catch (err) {
                spawnToastNotification("Failed to package data matrices.", "danger");
            }
        });
    }

    /* IMPORT BACKUP JSON HANDLER */
    if (importStateInput) {
        importStateInput.addEventListener("change", (e) => {
            const chosenBackupFile = e.target.files[0];
            if (!chosenBackupFile) return;

            const backupReader = new FileReader();
            backupReader.onload = function(eventResult) {
                try {
                    const compiledParsedState = JSON.parse(eventResult.target.result);
                    if (compiledParsedState.username && compiledParsedState.tasks) {
                        appState = compiledParsedState;
                        saveApp();
                        synchronizeProfileNamesAcrossWorkspace();
                        document.body.className = appState.theme;
                        applySystemModeClass(appState.currentMode || "focus");
                        renderAll();
                        spawnToastNotification("Nexus Board instance restored perfectly from snapshot.", "success");
                        
                        const outputConsole = document.getElementById("botConsoleOutput");
                        if (outputConsole) outputConsole.innerText = "✦ Matrix Restore Complete! Ah, that feels better. All your tracks, history, and files are loaded up perfectly. Let's get back to it! ✨";
                    } else {
                        spawnToastNotification("Invalid file profile structures found.", "danger");
                    }
                } catch (err) {
                    spawnToastNotification("Error parsing workspace backup mapping JSON.", "danger");
                }
            };
            backupReader.readAsText(chosenBackupFile);
            importStateInput.value = ""; 
        });
    }

    if (editNameBtn) {
        editNameBtn.addEventListener("click", () => {
            const requestedNewUsernameInput = prompt("Modify project owner signature identity:", appState.username);
            if (requestedNewUsernameInput !== null && requestedNewUsernameInput.trim() !== "") {
                appState.username = requestedNewUsernameInput.trim();
                addActivity(`Changed active workspace username context to: "${appState.username}"`);
                saveApp();
                synchronizeProfileNamesAcrossWorkspace();
                spawnToastNotification(`Identity calibrated to ${appState.username}`, "success");
                
                const outputConsole = document.getElementById("botConsoleOutput");
                if (outputConsole) outputConsole.innerText = `Ooh, "${appState.username}" sounds incredibly powerful. Signature verified across Nexus Board modules! ✒️🌟`;
            }
        });
    }

    document.querySelectorAll(".menu-item").forEach(menuTabButton => {
        if(menuTabButton.id === "exportStateBtn" || menuTabButton.classList.contains("import-action-label")) return;
        menuTabButton.addEventListener("click", () => {
            document.querySelectorAll(".menu-item").forEach(btn => btn.classList.remove("active"));
            document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));

            menuTabButton.classList.add("active");
            const targetedPageId = `${menuTabButton.dataset.page}-page`;
            const targetedPageDomNode = document.getElementById(targetedPageId);
            
            if (targetedPageDomNode) targetedPageDomNode.classList.add("active-page");
            
            if (menuTabButton.dataset.page === "boards") renderBoards();
            if (menuTabButton.dataset.page === "calendar") renderCalendar();
            if (menuTabButton.dataset.page === "analytics") renderAnalytics();
            if (menuTabButton.dataset.page === "activity") renderActivity();

            if (sidebarNode) sidebarNode.classList.remove("mobile-drawer-open");
        });
    });

    if (menuOpenBtn) menuOpenBtn.addEventListener("click", () => sidebarNode.classList.add("mobile-drawer-open"));
    if (menuCloseBtn) menuCloseBtn.addEventListener("click", () => sidebarNode.classList.remove("mobile-drawer-open"));

    if (modalFileInput) {
        modalFileInput.addEventListener("change", e => {
            const resourceFileObj = e.target.files[0];
            if (!resourceFileObj) return;

            const fileDataTrackerReader = new FileReader();
            fileDataTrackerReader.onload = function(eventResult) {
                contextAttachedFileBuffer = {
                    name: resourceFileObj.name,
                    size: (resourceFileObj.size / 1024).toFixed(1) + " KB",
                    binaryPayload: eventResult.target.result
                };
                fileUploadStatus.innerText = `📎 Linked: ${contextAttachedFileBuffer.name}`;
                fileUploadStatus.style.color = "#4ade80";
                spawnToastNotification(`Resource staged: ${contextAttachedFileBuffer.name}`);
            };
            fileDataTrackerReader.readAsDataURL(resourceFileObj);
        });
    }

    if (createTaskBtn) {
        createTaskBtn.addEventListener("click", () => {
            if (!taskInput.value.trim()) return;

            const structuredDataNode = {
                id: Date.now(),
                title: taskInput.value.trim(),
                priority: priorityInput.value,
                dueDate: dateInput.value || new Date().toISOString().split('T')[0],
                board: boardInput.value.trim() || "General Board",
                tags: tagsInput.value ? tagsInput.value.split(",").map(t => t.trim()).filter(Boolean) : ["Task"],
                status: "backlog",
                linkedFile: contextAttachedFileBuffer ? { name: contextAttachedFileBuffer.name, size: contextAttachedFileBuffer.size } : null
            };

            if (contextAttachedFileBuffer) {
                appState.fileStorageMock[structuredDataNode.id] = contextAttachedFileBuffer.binaryPayload;
            }

            appState.tasks.push(structuredDataNode);
            addActivity(`Created task entry: ${structuredDataNode.title}`);
            saveApp();
            renderAll();
            
            spawnToastNotification(`Task added to backlog.`, "success");
            
            const outputConsole = document.getElementById("botConsoleOutput");
            if (outputConsole) {
                outputConsole.innerText = `Track added! I dropped "${structuredDataNode.title}" straight into your backlog. Let's make short work of it! 🎯📦`;
            }

            taskInput.value = ""; tagsInput.value = ""; boardInput.value = ""; dateInput.value = ""; modalFileInput.value = "";
            contextAttachedFileBuffer = null;
            fileUploadStatus.innerText = "No local files linked."; fileUploadStatus.style.color = "";
            modal.classList.add("hidden");
        });
    }

    document.querySelectorAll(".mode-btn").forEach(modeButton => {
        modeButton.addEventListener("click", () => {
            document.querySelectorAll(".mode-btn").forEach(btn => btn.classList.remove("active"));
            modeButton.classList.add("active");
            
            const targetedMode = modeButton.dataset.mode;
            appState.currentMode = targetedMode;
            saveApp();
            applySystemModeClass(targetedMode);
            addActivity(`Switched display matrix to mode: ${targetedMode.toUpperCase()}`);
            spawnToastNotification(`Workspace mode: ${targetedMode.toUpperCase()}`);
            
            // Adapt Zia's response styling based on the selected mode
            const outputConsole = document.getElementById("botConsoleOutput");
            if (outputConsole) {
                if (targetedMode === "dev") outputConsole.innerText = "✦ TECHNICAL SANDBOX SKINNED.\nZia operating array diagnostics... Monospace variables active. Let's write some flawless logic, compilation king. ⚡⚡";
                else if (targetedMode === "creative") outputConsole.innerText = "Ooh, artist vibes! Doodle background overlay initialized. Let's dream up something beautiful, rules are officially suspended! 🎨✨";
                else if (targetedMode === "cyberpunk") outputConsole.innerText = "⚠️ SYSTEM ALERT: Neon Grid activated. Zia terminal overrides processing high-voltage action cards. Let's neon-hack this project baseline! 🤖💥";
                else if (targetedMode === "zen") spawnToastNotification("Zen Mode initialized.");
                else outputConsole.innerText = "Back to the master blueprint. Standard collaborative Kanban tracking columns aligned. Balanced and ready! 🎯";
            }
        });
    });

    document.querySelectorAll(".theme-card").forEach(skinButtonCard => {
        skinButtonCard.addEventListener("click", () => {
            const targetedThemeSkinClass = skinButtonCard.dataset.theme;
            appState.theme = targetedThemeSkinClass;
            document.body.className = targetedThemeSkinClass;
            saveApp();
            addActivity(`Updated visual skin theme to: ${targetedThemeSkinClass}`);
            spawnToastNotification("Environmental theme altered.", "success");
            
            const outputConsole = document.getElementById("botConsoleOutput");
            if (outputConsole) outputConsole.innerText = `Wow, nice choice! The workspace looks gorgeous in this theme layer. Total atmospheric upgrade! 🌌💅`;
        });
    });

    if (document.getElementById("searchInput")) {
        document.getElementById("searchInput").addEventListener("input", e => {
            const searchTokenString = e.target.value.toLowerCase();
            document.querySelectorAll(".task-card").forEach(cardElement => {
                const combinedInnerContent = cardElement.innerText.toLowerCase();
                cardElement.style.display = combinedInnerContent.includes(searchTokenString) ? "block" : "none";
            });
        });
    }

    if (submitBotQueryBtn) submitBotQueryBtn.addEventListener("click", parseZiaAutomationDirectives);
}

/* --- TRUE PIPELINE COUPLING MECHANICS --- */
function initializeTrueDragAndDropPipeline() {
    const structuralColumnContainers = document.querySelectorAll(".board-column");

    structuralColumnContainers.forEach(columnElementWrapper => {
        columnElementWrapper.addEventListener("dragenter", e => {
            e.preventDefault();
            columnElementWrapper.classList.add("drag-hovering-active");
        });
        columnElementWrapper.addEventListener("dragover", e => e.preventDefault());
        columnElementWrapper.addEventListener("dragleave", () => {
            columnElementWrapper.classList.remove("drag-hovering-active");
        });
        columnElementWrapper.addEventListener("drop", e => {
            e.preventDefault();
            columnElementWrapper.classList.remove("drag-hovering-active");
            
            const runningDraggedCard = document.querySelector(".dragging");
            if (!runningDraggedCard) return;

            const targetingTaskId = Number(runningDraggedCard.dataset.id);
            const targetTaskObj = appState.tasks.find(t => t.id === targetingTaskId);
            const destinationStatusId = columnElementWrapper.dataset.status;

            if (targetTaskObj && targetTaskObj.status !== destinationStatusId) {
                const legacyColumnStatus = targetTaskObj.status;
                targetTaskObj.status = destinationStatusId;
                
                addActivity(`Moved task "${targetTaskObj.title}" from ${legacyColumnStatus} to ${destinationStatusId}`);
                saveApp();
                renderAll();
                spawnToastNotification(`Moved card to ${destinationStatusId.toUpperCase()}`);
                
                const outputConsole = document.getElementById("botConsoleOutput");
                if (outputConsole) {
                    if (destinationStatusId === "completed") {
                        const complimentaryPhrase = ZIA_FLAVORS.compliments[Math.floor(Math.random() * ZIA_FLAVORS.compliments.length)];
                        outputConsole.innerText = `YES! You completely finished "${targetTaskObj.title}"! ${complimentaryPhrase} 🎉🏆`;
                    } else {
                        outputConsole.innerText = `Got it, I updated the status layout index tracking. "${targetTaskObj.title}" shifted over to ${destinationStatusId.toUpperCase()}! ⚙️`;
                    }
                }
            }
        });
    });

    if (trashDropzone) {
        trashDropzone.addEventListener("dragenter", (e) => {
            e.preventDefault();
            trashDropzone.classList.add("trash-hovering-glow");
        });
        trashDropzone.addEventListener("dragover", (e) => e.preventDefault());
        trashDropzone.addEventListener("dragleave", () => {
            trashDropzone.classList.remove("trash-hovering-glow");
        });
        trashDropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            trashDropzone.classList.remove("trash-hovering-glow");

            const runningDraggedCard = document.querySelector(".dragging");
            if (!runningDraggedCard) return;

            const targetingTaskId = Number(runningDraggedCard.dataset.id);
            executePermanentTaskPurge(targetingTaskId);
        });
    }
}

function triggerTaskDeletionInline(taskId, event) {
    if (event) event.stopPropagation();
    executePermanentTaskPurge(taskId);
}

function executePermanentTaskPurge(taskId) {
    const searchTargetIdx = appState.tasks.findIndex(t => t.id === taskId);
    if (searchTargetIdx === -1) return;

    const isolatedTitleString = appState.tasks[searchTargetIdx].title;
    appState.tasks.splice(searchTargetIdx, 1);
    
    if (appState.fileStorageMock[taskId]) delete appState.fileStorageMock[taskId];

    addActivity(`Permanently purged card track vector item: "${isolatedTitleString}"`);
    saveApp();
    renderAll();
    spawnToastNotification(`Purged task entry.`, "danger");
    
    const outputConsole = document.getElementById("botConsoleOutput");
    if (outputConsole) {
        outputConsole.innerText = `Poof! I've vaporized "${isolatedTitleString}" from our storage arrays. Fresh slate! 🗑️💨`;
    }
}

function downloadAttachedResourceNodeAsset(taskId, event) {
    if (event) event.stopPropagation();
    
    const binaryFilePayloadString = appState.fileStorageMock[taskId];
    const trackingTargetTaskMetaData = appState.tasks.find(t => t.id === taskId);

    if (!binaryFilePayloadString || !trackingTargetTaskMetaData) {
        spawnToastNotification("Binary asset payload missing.", "danger");
        return;
    }

    const browserDownloadBridgeAnchorElement = document.createElement("a");
    browserDownloadBridgeAnchorElement.href = binaryFilePayloadString;
    browserDownloadBridgeAnchorElement.download = trackingTargetTaskMetaData.linkedFile.name;
    document.body.appendChild(browserDownloadBridgeAnchorElement);
    browserDownloadBridgeAnchorElement.click();
    document.body.removeChild(browserDownloadBridgeAnchorElement);
    spawnToastNotification(`Downloading asset file.`, "success");
}

/* --- STOPWATCH ENGINE --- */
function initializeStopwatchWidgetEngine() {
    const dsp = document.getElementById("stopwatchDisplay");
    const start = document.getElementById("swStartBtn");
    const pause = document.getElementById("swPauseBtn");
    const reset = document.getElementById("swResetBtn");

    if (!dsp) return;

    start.addEventListener("click", () => {
        if (stopwatchIntervalId) return;
        stopwatchIntervalId = setInterval(() => {
            elapsedStopwatchMilliseconds += 1000;
            let totalSecs = Math.floor(elapsedStopwatchMilliseconds / 1000);
            let hours = Math.floor(totalSecs / 3600);
            let mins = Math.floor((totalSecs % 3600) / 60);
            let secs = totalSecs % 60;

            dsp.innerText = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
        spawnToastNotification("Focus sprint tracking engine active.");
        
        const outputConsole = document.getElementById("botConsoleOutput");
        if (outputConsole) outputConsole.innerText = "Focus Mode locked in. Focus timer is running! Shhh... absolute deep work zone initialized. Let's do this! 🎯🤫";
    });

    pause.addEventListener("click", () => {
        clearInterval(stopwatchIntervalId);
        stopwatchIntervalId = null;
        spawnToastNotification("Focus stopwatch suspended.");
        
        const outputConsole = document.getElementById("botConsoleOutput");
        if (outputConsole) outputConsole.innerText = "Timer paused! Take a deep breath, grab a sip of water, and hit resume when you're ready to dive back under. ☕";
    });

    reset.addEventListener("click", () => {
        clearInterval(stopwatchIntervalId);
        stopwatchIntervalId = null;
        elapsedStopwatchMilliseconds = 0;
        dsp.innerText = "00:00:00";
        spawnToastNotification("Focus sprint clock zeroed out.");
        
        const outputConsole = document.getElementById("botConsoleOutput");
        if (outputConsole) outputConsole.innerText = "Focus tracking logs reset. Ready for a completely fresh work cycle iteration! 🔄";
    });
}

/* --- COZY HEALTH COMPLIANCE CHECK LOOPS --- */
function initializeActiveHealthCheckScheduler() {
    const botIndicatorDot = document.getElementById("botStatusDot");
    const botHeaderTitle = document.getElementById("botHeaderTitle");
    const outputConsole = document.getElementById("botConsoleOutput");

    setInterval(() => {
        let ongoingLiveDuration = Date.now() - applicationSessionBootTime;
        if (ongoingLiveDuration > THRESHOLD_HEALTH_REMINDER_MS) {
            if (botIndicatorDot) botIndicatorDot.style.background = "#fbbf24"; 
            if (botHeaderTitle) botHeaderTitle.innerText = "Zia • Cozy AI Workspace Partner ⚠️";
            if (outputConsole && !outputConsole.innerText.includes("HEALTH ALERT REMINDER")) {
                outputConsole.innerHTML = `<span style="color:#fbbf24; font-weight:700;">✦ ZIA'S COZY HEALTH ALERT OVERRIDE:</span>\n\nHey, listen! You've been coding and crushing tasks inside Nexus Board for an extended sprint block. \n\nYour eyes need a break, your neck needs a stretch, and your brain needs a brief breathing window. Stand up, rest your eyes, and take 2 minutes for yourself. I'll watch the board entries while you're away! 🧘🌿`;
                spawnToastNotification("Health warning dispatched from Zia dashboard.", "danger");
            }
        }
    }, 15000);
}

function applySystemModeClass(modeIdentifierString) {
    document.body.classList.remove("mode-focus-view", "mode-dev-view", "mode-zen-view", "mode-creative-view", "mode-cyberpunk-view");
    document.body.classList.add(`mode-${modeIdentifierString}-view`);
    
    const statusTextHeaderElement = document.getElementById("liveStatusSubtitle");
    const structuralModeDisplayBadge = document.getElementById("currentModeBadge");
    
    if (structuralModeDisplayBadge) {
        structuralModeDisplayBadge.innerText = `${modeIdentifierString.toUpperCase()} VIEW PROFILE`;
    }
    if (statusTextHeaderElement) {
        if (modeIdentifierString === "zen") statusTextHeaderElement.innerText = "Minimalist layout active. Interface noise eliminated.";
        else if (modeIdentifierString === "dev") statusTextHeaderElement.innerText = "Monospaced technical syntax layout processing logs active.";
        else if (modeIdentifierString === "creative") statusTextHeaderElement.innerText = "Transparent design matrix active. Doodle brainstorming mode initialized.";
        else if (modeIdentifierString === "cyberpunk") statusTextHeaderElement.innerText = "High contrast cyberpunk matrix environment layer running.";
        else statusTextHeaderElement.innerText = "Standard collaborative task tracking kanban boards pipeline enabled.";
    }
}

function renderAll() {
    renderTasks();
    renderStats();
}

function renderTasks() {
    const layoutColumnsMap = {
        backlog: document.getElementById("backlog"),
        progress: document.getElementById("progress"),
        review: document.getElementById("review"),
        completed: document.getElementById("completed")
    };

    Object.values(layoutColumnsMap).forEach(colNodeSlot => { if (colNodeSlot) colNodeSlot.innerHTML = ""; });

    appState.tasks.forEach(taskItemNode => {
        const structuralCardElementNode = document.createElement("div");
        structuralCardElementNode.className = "task-card";
        structuralCardElementNode.draggable = true;
        structuralCardElementNode.dataset.id = taskItemNode.id;

        let attachmentBadgeString = "";
        if (taskItemNode.linkedFile) {
            attachmentBadgeString = `<div class="attached-file-badge" onclick="downloadAttachedResourceNodeAsset(${taskItemNode.id}, event)">📎 Link: ${taskItemNode.linkedFile.name}</div>`;
        }

        structuralCardElementNode.innerHTML = `
            <button class="inline-card-delete-trigger" onclick="triggerTaskDeletionInline(${taskItemNode.id}, event)" title="Delete Task">❌</button>
            <div class="task-title">${taskItemNode.title}</div>
            ${attachmentBadgeString}
            <div class="task-tags">
                ${taskItemNode.tags.map(t => `<div class="tag">${t}</div>`).join("")}
            </div>
            <div class="task-footer">
                <div class="priority ${taskItemNode.priority.toLowerCase()}">${taskItemNode.priority}</div>
                <div style="opacity: 0.5;">📅 ${taskItemNode.dueDate}</div>
            </div>
        `;

        structuralCardElementNode.addEventListener("dragstart", () => structuralCardElementNode.classList.add("dragging"));
        structuralCardElementNode.addEventListener("dragend", () => structuralCardElementNode.classList.remove("dragging"));

        structuralCardElementNode.addEventListener("click", () => {
            if (window.innerWidth <= 768) promoteMobileTaskStageTransition(taskItemNode);
        });

        if (layoutColumnsMap[taskItemNode.status]) {
            layoutColumnsMap[taskItemNode.status].appendChild(structuralCardElementNode);
        }
    });
}

function promoteMobileTaskStageTransition(taskItemDataReference) {
    const stagesArrayLoopSequence = ["backlog", "progress", "review", "completed"];
    let numericalCurrentIndexLocation = stagesArrayLoopSequence.indexOf(taskItemDataReference.status);
    let nextIndexTargetLocation = (numericalCurrentIndexLocation + 1) % stagesArrayLoopSequence.length;
    
    taskItemDataReference.status = stagesArrayLoopSequence[nextIndexTargetLocation];
    saveApp();
    renderAll();
}

function renderStats() {
    const trackingLengthMetric = appState.tasks.length;
    const completedLengthMetric = appState.tasks.filter(t => t.status === "completed").length;
    const pendingActiveTasksMetric = trackingLengthMetric - completedLengthMetric;
    const performanceEfficiencyQuotient = trackingLengthMetric === 0 ? 0 : Math.round((completedLengthMetric / trackingLengthMetric) * 100);

    if (document.getElementById("totalTasks")) document.getElementById("totalTasks").innerText = trackingLengthMetric;
    if (document.getElementById("completedTasks")) document.getElementById("completedTasks").innerText = completedLengthMetric;
    if (document.getElementById("pendingTasks")) document.getElementById("pendingTasks").innerText = pendingActiveTasksMetric;
    if (document.getElementById("completionRate")) document.getElementById("completionRate").innerText = `${performanceEfficiencyQuotient}%`;
}

function renderBoards() {
    const outputGridWrapperNode = document.getElementById("boardsGrid");
    if (!outputGridWrapperNode) return;
    outputGridWrapperNode.innerHTML = "";

    const arrayUniqueDiscoveredBoards = [...new Set(appState.tasks.map(t => t.board || "General Board"))];
    if (arrayUniqueDiscoveredBoards.length === 0) {
        outputGridWrapperNode.innerHTML = `<p style="opacity:0.5; padding:10px;">No custom clusters tracked. Create a task with a board target to generate arrays.</p>`;
        return;
    }
    arrayUniqueDiscoveredBoards.forEach(boardTitleString => {
        const smallBoardCardElementNode = document.createElement("div");
        smallBoardCardElementNode.className = "mini-board";
        smallBoardCardElementNode.innerText = boardTitleString.toUpperCase();
        outputGridWrapperNode.appendChild(smallBoardCardElementNode);
    });
}

function renderCalendar() {
    const outputCalendarBoxElementNode = document.getElementById("calendarBox");
    if (!outputCalendarBoxElementNode) return;
    outputCalendarBoxElementNode.innerHTML = "";

    if (appState.tasks.length === 0) {
        outputCalendarBoxElementNode.innerHTML = `<p style="opacity:0.5; padding:10px;">Schedule pipeline empty.</p>`;
        return;
    }
    appState.tasks.forEach(task => {
        const itemEventRowNode = document.createElement("div");
        itemEventRowNode.className = "calendar-event";
        itemEventRowNode.innerHTML = `<strong>${task.title}</strong><span style="float: right; opacity: 0.5;">📅 Target Line: ${task.dueDate}</span>`;
        outputCalendarBoxElementNode.appendChild(itemEventRowNode);
    });
}

let analyticalDoughnutChartInstance = null;
function renderAnalytics() {
    const targetedCanvasContextNode = document.getElementById("productivityChart");
    if (!targetedCanvasContextNode) return;

    const aggregateTasksComplete = appState.tasks.filter(t => t.status === "completed").length;
    const aggregateTasksPending = appState.tasks.length - aggregateTasksComplete;

    if (analyticalDoughnutChartInstance) analyticalDoughnutChartInstance.destroy();

    analyticalDoughnutChartInstance = new Chart(targetedCanvasContextNode, {
        type: "doughnut",
        data: {
            labels: ["Completed Track Elements", "Pending Backlog Clusters"],
            datasets: [{
                data: [aggregateTasksComplete, aggregateTasksPending],
                backgroundColor: ["#10B981", "#6366f1"],
                borderWidth: 0
            }]
        },
        options: {
            plugins: { legend: { labels: { color: '#f8fafc', font: { family: 'Inter', size: 12 } } } },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function addActivity(text) {
    appState.activity.unshift({ text, time: new Date().toLocaleTimeString() });
}

function renderActivity() {
    const logFeedStreamBoxElement = document.getElementById("activityFeed");
    if (!logFeedStreamBoxElement) return;
    logFeedStreamBoxElement.innerHTML = "";

    if (appState.activity.length === 0) {
        logFeedStreamBoxElement.innerHTML = `<p style="opacity:0.5; padding:10px;">No transaction activities cached.</p>`;
        return;
    }
    appState.activity.slice(0, 15).forEach(logItem => {
        const logDisplayRowNode = document.createElement("div");
        logDisplayRowNode.className = "activity-item";
        logDisplayRowNode.innerHTML = `<strong>${logItem.text}</strong><p style="font-size:11px; opacity:0.4; margin-top:4px;">Log Frame Time: ${logItem.time}</p>`;
        logFeedStreamBoxElement.appendChild(logDisplayRowNode);
    });
}

/* --- THE FULLY LIVING CHATTER AUTOMATION ENGINE PARSER --- */
function parseZiaAutomationDirectives() {
    const feedbackConsolePreNode = document.getElementById("botConsoleOutput");
    const workingRawInputString = botInputField.value.trim();
    if (!workingRawInputString) return;

    feedbackConsolePreNode.innerHTML = `<span style="color:#a855f7">✦ Zia is reading your thoughts... ✨</span>`;
    
    setTimeout(() => {
        let evaluatedBotFeedbackLogString = "";
        const standardizedTokenInput = workingRawInputString.toLowerCase();

        // Check if user is saying hello or talking to Zia
        if (standardizedTokenInput === "hello" || standardizedTokenInput === "hi" || standardizedTokenInput === "hey" || standardizedTokenInput.includes("yo")) {
            const randomPoke = ZIA_FLAVORS.pokes[Math.floor(Math.random() * ZIA_FLAVORS.pokes.length)];
            evaluatedBotFeedbackLogString = `Hey boss! Zia is completely locked into the Nexus Board matrix. Here's a quick status update for you:\n\n${randomPoke}\n\nNeed to add a task? Just throw an 'add' directive my way!`;
        }
        else if (standardizedTokenInput.startsWith("create") || standardizedTokenInput.startsWith("add")) {
            let taskTitleSegment = workingRawInputString.replace(/create|add/gi, "").trim();
            let extractedBoardName = "Zia Board";
            let extractedPriorityValue = "Medium";

            if (taskTitleSegment.includes("/board:")) {
                const parts = taskTitleSegment.split("/board:");
                taskTitleSegment = parts[0].trim(); extractedBoardName = parts[1].split("/")[0].trim();
            }
            if (workingRawInputString.includes("/priority:")) {
                const priorityExtractionParts = workingRawInputString.split("/priority:");
                extractedPriorityValue = priorityExtractionParts[1].split("/")[0].trim();
                taskTitleSegment = taskTitleSegment.split("/priority:")[0].trim();
            }

            if (taskTitleSegment) {
                const automatedInjectedTaskStructure = {
                    id: Date.now(), title: taskTitleSegment, priority: extractedPriorityValue,
                    dueDate: new Date().toISOString().split('T')[0], board: extractedBoardName,
                    tags: ["Zia-Generated"], status: "backlog", linkedFile: null
                };

                appState.tasks.push(automatedInjectedTaskStructure);
                addActivity(`Bot generated task: ${taskTitleSegment}`);
                saveApp(); renderAll();

                evaluatedBotFeedbackLogString = `✦ PARSER INJECTION SUCCESSFUL! 🎉\n\n` +
                                                 `I grabbed your instruction, wrapped it into code formatting, and injected it into the project matrix:\n` +
                                                 `• Board Name: "${extractedBoardName}"\n` +
                                                 `• Priority Level: [${extractedPriorityValue}]\n\n` +
                                                 `Boom! Your new card "${taskTitleSegment}" is live in our workspace backlog column. Let's conquer it!`;
                spawnToastNotification("Task parsed and added by Zia.", "success");
            } else {
                evaluatedBotFeedbackLogString = `Oops! I couldn't find a task title there. Try typing it like this: "add Refine engine matrix /board:VTU /priority:High" and I'll handle the parsing! 🧠`;
            }
        } 
        else if (standardizedTokenInput.includes("status") || standardizedTokenInput.includes("metrics") || standardizedTokenInput.includes("how are we doing")) {
            const completeCount = appState.tasks.filter(t => t.status === "completed").length;
            evaluatedBotFeedbackLogString = `✦ TELEMETRY SPRINT DATA GENERATED! 📈\n\n` +
                                             `Let's take a look at our current velocity profiles, boss:\n` +
                                             `• Tracks Logged in System: ${appState.tasks.length} elements\n` +
                                             `• Milestones Met: ${completeCount} completed cards\n` +
                                             `• Display Mode Configuration: ${appState.currentMode.toUpperCase()}\n\n` +
                                             `You are running an incredibly tight workflow today. Let's clear out a few more backlog items!`;
        }
        else if (standardizedTokenInput.includes("clear") || standardizedTokenInput.includes("purge") || standardizedTokenInput.includes("wipe")) {
            appState.tasks = []; appState.activity = []; appState.fileStorageMock = {};
            saveApp(); renderAll();
            evaluatedBotFeedbackLogString = `✦ COMPLETE DATABASE PURGE EXECUTION COMPLETE.\n\nEverything is gone, clean slates across all vectors! Let's start building the next generation engine layout from ground zero. 🌪️✨`;
            spawnToastNotification("Workspace entirely purged.", "danger");
        }
        else {
            evaluatedBotFeedbackLogString = `Hmm, Zia is thinking... I didn't quite catch that exact directive pattern! 


You can say things like:
• "hi" or "hello" to check in on me.
• "add [Task name] /board:[Name] /priority:[High]" to quickly throw cards on your board.
• "status" to pull instant workspace velocity statistics.`;
        }

        feedbackConsolePreNode.innerText = evaluatedBotFeedbackLogString;
        botInputField.value = "";
    }, 300);
}

function saveApp() {
    localStorage.setItem("nexus-board-state", JSON.stringify(appState));
}