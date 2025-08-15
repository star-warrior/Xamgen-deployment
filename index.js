document.addEventListener("DOMContentLoaded", function () {
    // Elements
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const navItems = document.querySelectorAll(".nav-item");
    const slides = document.querySelectorAll(".slide");
    const goSettings = document.getElementById("goSettings");
    const moduleMsg = document.getElementById("moduleMsg");
    const userName = document.getElementById("userName");
    const currentPage = document.getElementById("currentPage");
    const settingsForm = document.getElementById("settingsForm");
    const historyContainer = document.getElementById("history-container");
    const getStartedBtn = document.querySelector(".get-started-btn");
    const moduleList = document.getElementById("moduleList");
    const moduleFileInput = document.getElementById("moduleFileInput");
    const importModuleBtn = document.getElementById("importModuleBtn");
    const moduleName = document.getElementById("moduleName");
    const questionList = document.getElementById("questionList");
    const modulePage = document.getElementById("modulePage");
    const homePage = document.getElementById("homePage");
    const selectedCount = document.getElementById("selectedCount");
    let isProcessing = false;

    let uploadedModules = [];
    let selectedQuestions = 0;

    // Local storage helper
    const storage = {
        save: function (key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        },
        get: function (key) {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        },
    };

    // Initial data setup
    function initializeData() {
        // Load saved username
        const savedUsername = storage.get("userName");
        if (savedUsername) {
            userName.value = savedUsername;
        }

        // Load module message
        const savedModuleMsg = storage.get("moduleMsg");
        if (savedModuleMsg) {
            moduleMsg.textContent = savedModuleMsg;
        }

        // Initialize history
        updateHistoryView();
    }

    // Initialize slide system
    function initializeSlides() {
        navItems.forEach((item) => {
            item.addEventListener("click", function (e) {
                e.preventDefault();
                navigateToSlide(this.getAttribute("data-slide"));
            });
        });
    }

    // Navigate to a specific slide
    function navigateToSlide(slideId) {
        // Close sidebar
        closeSidebar();

        // Update active slide
        slides.forEach((slide) => {
            slide.classList.remove("active");
        });

        // Show appropriate slide
        let activeSlideId;

        switch (slideId) {
            case "home":
                activeSlideId = "home-slide";
                break;
            case "about":
                activeSlideId = "about-slide";
                break;
            case "history":
                activeSlideId = "history-slide";
                updateHistoryView();
                break;
            case "settings":
                activeSlideId = "settings-slide";
                break;
            default:
                activeSlideId = "home-slide";
        }

        document.getElementById(activeSlideId).classList.add("active");

        // Update menu title
        currentPage.textContent =
            slideId.charAt(0).toUpperCase() + slideId.slice(1);

        // Update active nav item
        navItems.forEach((item) => {
            if (item.getAttribute("data-slide") === slideId) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });
    }

    // Handle sidebar toggle
    function initializeSidebar() {
        menuToggle.addEventListener("click", function () {
            sidebar.classList.toggle("open");
            overlay.classList.toggle("active");
        });

        overlay.addEventListener("click", closeSidebar);
    }

    function closeSidebar() {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
    }

    // Handle editable module message
    function initializeEditableFields() {
        moduleMsg.addEventListener("dblclick", function () {
            this.contentEditable = true;
            this.classList.add("editing");
            this.focus();
        });

        moduleMsg.addEventListener("blur", function () {
            this.contentEditable = false;
            this.classList.remove("editing");
            storage.save("moduleMsg", this.textContent);
        });

        moduleMsg.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                this.blur();
            }
        });
    }

    // Update history view based on stored data
    function updateHistoryView() {
        const hasHistory = storage.get("hasHistory") || false;
        const history = storage.get("history") || [];

        if (hasHistory && history.length > 0) {
            // Show history items
            historyContainer.innerHTML = "";
            history.forEach((item) => {
                const historyItem = createHistoryItem(item);
                historyContainer.appendChild(historyItem);
            });
        } else {
            // Show no history message
            historyContainer.innerHTML =
                '<h2 class="no-history">Oops!! No history</h2>';
        }
    }

    // Create a history item element
    function createHistoryItem(item) {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `
                <div class="history-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#242937" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
                <p>${item.name || "Previous"}</p>
            `;
        div.setAttribute(
            "aria-label",
            `History item: ${item.name || "Previous"}`
        );
        return div;
    }

    // Handle settings form submission
    function initializeSettingsForm() {
        if (settingsForm) {
            settingsForm.addEventListener("submit", function (e) {
                e.preventDefault();

                const moduleName = document.getElementById("moduleName").value;
                const moduleDescription =
                    document.getElementById("moduleDescription").value;

                if (moduleName) {
                    // Save module
                    const modules = storage.get("modules") || [];
                    modules.push({
                        name: moduleName,
                        description: moduleDescription,
                        timestamp: new Date().toISOString(),
                    });
                    storage.save("modules", modules);

                    // Add to history
                    const history = storage.get("history") || [];
                    history.push({
                        name: moduleName,
                        timestamp: new Date().toISOString(),
                    });
                    storage.save("history", history);
                    storage.save("hasHistory", true);

                    // Reset form
                    this.reset();

                    // Show success message
                    alert("Module saved successfully!");
                }
            });
        }
    }

    // Initialize user name handling
    function initializeUserName() {
        userName.addEventListener("input", function () {
            storage.save("userName", this.value);
        });
    }

    // Initialize quick navigation features
    function initializeQuickNav() {
        // Go to settings
        goSettings.addEventListener("click", function () {
            navigateToSlide("settings");
        });

        // Get started button
        getStartedBtn.addEventListener("click", function () {
            sidebar.classList.add("open");
            overlay.classList.add("active");
        });
    }

    // Display uploaded modules in the home section
    function displayModules() {
        moduleList.innerHTML = "";

        if (uploadedModules.length === 0) {
            moduleList.innerHTML = `<h2>No modules uploaded yet</h2>`;
            return;
        }

        uploadedModules.forEach((module, index) => {
            const moduleCard = document.createElement("div");
            moduleCard.className = "module-card";
            moduleCard.innerHTML = `
                <div class="module-icon">📘</div>
                <div class="module-info">
                    <h3 class="module-name">${module.name}</h3>
                </div>
            `;
            moduleCard.addEventListener("click", () => {
                window.open(module.fileUrl, "_blank");
            });

            moduleList.appendChild(moduleCard);
        });
    }

    // Remove any existing event listeners
    importModuleBtn.replaceWith(importModuleBtn.cloneNode(true));

    // Get the new button reference after replacing
    const newImportModuleBtn = document.getElementById("importModuleBtn");

    // Add single click event listener to the import button
    newImportModuleBtn.addEventListener("click", () => {
        if (!moduleName.value.trim()) {
            alert("Please enter a module name first");
            return;
        }
        moduleFileInput.click();
    });

    // Handle file selection
    moduleFileInput.addEventListener("change", (event) => {
        if (isProcessing) return;
        isProcessing = true;

        const file = event.target.files[0];
        if (file) {
            processFile(file, moduleName.value.trim());
        }

        // Reset the file input to allow selecting the same file again
        moduleFileInput.value = "";
        isProcessing = false;
    });

    function processFile(file, moduleName) {
        if (file.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = function (event) {
                const content = event.target.result;
                const questions = extractQuestions(content);
                showModulePage(moduleName, questions);
            };
            reader.readAsText(file);
        } else if (file.type === "application/pdf") {
            const reader = new FileReader();
            reader.onload = function (event) {
                const typedArray = new Uint8Array(event.target.result);
                extractTextFromPDF(typedArray).then((content) => {
                    const questions = extractQuestions(content);
                    showModulePage(moduleName, questions);
                });
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert("Unsupported file type. Please upload a .txt or .pdf file.");
        }
    }

    // Handle import module button click
    importModuleBtn.addEventListener('click', () => {
        moduleFileInput.click();
    });

    // Handle file selection
    moduleFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Update UI to show selected file
            importModuleBtn.textContent = `Selected: ${file.name}`;
        }
    });

    // Process the uploaded file
    function processFile(file, moduleName) {
        if (file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const questions = extractQuestions(content);
                showModulePage(moduleName, questions);
            };
            reader.readAsText(file);
        } else if (file.type === 'application/pdf') {
            processPDFFile(file, moduleName);
        }
    }

    // Process PDF files
    async function processPDFFile(file, moduleName) {
        try {
            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let textContent = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                textContent += content.items.map(item => item.str).join(' ') + '\n';
            }

            const questions = extractQuestions(textContent);
            showModulePage(moduleName, questions);
        } catch (error) {
            console.error('Error processing PDF:', error);
            alert('Error processing PDF file');
        }
    }

    // Extract questions from content
    function extractQuestions(content) {
        const lines = content.split('\n');
        const questions = [];
        let currentQuestion = null;

        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('Q:')) {
                if (currentQuestion) {
                    questions.push(currentQuestion);
                }
                currentQuestion = {
                    question: line.substring(2).trim(),
                    answer: ''
                };
            } else if (currentQuestion && line) {
                currentQuestion.answer += line + ' ';
            }
        });

        if (currentQuestion) {
            questions.push(currentQuestion);
        }

        return questions;
    }

    // Show the module page with questions
    function showModulePage(moduleName, questions) {
        questionList.innerHTML = '';
        document.getElementById('moduleTitle').textContent = moduleName;

        questions.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item';
            questionDiv.innerHTML = `
                <div class="question-header">
                    <input type="checkbox" class="question-checkbox" onchange="updateSelectedCount(this)">
                    <span class="question-number">${index + 1}.</span>
                    <span class="question-text">${q.question}</span>
                    <button class="toggle-answer">▼</button>
                </div>
                <div class="answer" style="display: none;">
                    ${q.answer}
                </div>
            `;

            questionList.appendChild(questionDiv);
        });

        // Show module page
        document.querySelector('.slide.active').classList.remove('active');
        modulePage.style.display = 'block';
    }

    // Initial call to displayModules to handle the empty state
    displayModules();

    // Initialize all components
    function initialize() {
        initializeData();
        initializeSlides();
        initializeSidebar();
        initializeEditableFields();
        initializeSettingsForm();
        initializeUserName();
        initializeQuickNav();
    }

    // Start initialization
    initialize();
});

// Global function for updating selected count
window.updateSelectedCount = function (checkbox) {
    const count = document.querySelectorAll('.question-checkbox:checked').length;
    document.querySelector('.selected-count').textContent = `${count} questions selected`;
};

// Function to extract text from a PDF file using PDF.js
async function extractTextFromPDF(pdfData) {
    const pdfjsLib = window["pdfjs-dist/build/pdf"];
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

    const pdf = await pdfjsLib.getDocument(pdfData).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        text += pageText + "\n";
    }

    return text;
}