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

function viewPdf(filename) {
    window.location.href = `/paper?file=${filename}`;
}

// Update the existing file input handler
document
    .getElementById("moduleFileInput")
    .addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("file", file);

            fetch("/upload-pdf", {
                method: "POST",
                body: formData,
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        location.reload(); // Refresh to show new upload
                    } else {
                        alert(data.error);
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                    alert("Upload failed");
                });
        }
    });