// Replace the static questions array with a dynamic one
let questions = [];

// Initialize when the page loads
document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Fetch questions from the server
        const response = await fetch("/get-questions");
        const data = await response.json();

        if (data.error) {
            alert("Error loading questions: " + data.error);
            return;
        }

        // Update questions array with extracted questions
        questions = data.questions;

        // Initialize the UI
        initializeQuestions();
        updateModuleTitle(data.filename);

        // Add event listener for paper title changes
        document
            .getElementById("paperTitle")
            .addEventListener("input", function () {
                const newTitle = this.value;
                document.getElementById("finalPaperTitle").textContent = newTitle;
            });
    } catch (error) {
        console.error("Error:", error);
        alert("Error loading questions from PDF");
    }
});

// Initialize the questions in the first slide
function initializeQuestions() {
    const container = document.getElementById("questionsContainer");
    container.innerHTML = "";

    questions.forEach((question) => {
        const questionItem = document.createElement("div");
        questionItem.className = "question-item";
        questionItem.innerHTML = `
                    <div class="question-header" onclick="toggleAnswer(${question.id})">
                        <div>${question.id}.${question.text}</div>
                        <button class="question-toggle">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="question-answer" id="answer-${question.id}">
                        <div class="answer-text">${question.answer}</div>
                    </div>
                `;
        container.appendChild(questionItem);
    });
}

// Initialize the selection slide
function showSelectionSlide() {
    const container = document.getElementById(
        "selectableQuestionsContainer"
    );
    container.innerHTML = "";

    questions.forEach((question) => {
        const questionItem = document.createElement("div");
        questionItem.className = "question-item";
        questionItem.innerHTML = `
                    <div class="question-header">
                        <div style="display: flex; align-items: center;">
                            <div class="checkmark ${question.selected ? "selected" : ""
            }" 
                                 onclick="toggleSelection(${question.id
            }, event)">
                                ${question.selected ? "✓" : ""}
                            </div>
                            ${question.id}.${question.text}
                        </div>
                        <div class="mark-selector">
                            <select class="mark-value" onchange="updateMarks(${question.id
            }, this.value)">
                                ${generateMarksOptions(question.marks)}
                            </select>
                            <button class="question-toggle" onclick="toggleSelectionAnswer(${question.id
            }, event)">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="question-answer" id="selection-answer-${question.id
            }">
                        <div class="answer-text">${question.answer}</div>
                    </div>
                `;
        container.appendChild(questionItem);
    });

    showSlide("slide2");
    updateSelectedCount();
}

// Generate marks options from 3 to 15
function generateMarksOptions(selectedValue) {
    let options = "";
    for (let i = 3; i <= 15; i++) {
        options += `<option value="${i}" ${i === selectedValue ? "selected" : ""
            }>${i}</option>`;
    }
    return options;
}

// Toggle answer visibility in slide 1
function toggleAnswer(id) {
    const answerEl = document.getElementById(`answer-${id}`);
    const toggleButton =
        answerEl.previousElementSibling.querySelector(".question-toggle");

    if (answerEl.classList.contains("active")) {
        answerEl.classList.remove("active");
        toggleButton.classList.remove("active");
    } else {
        answerEl.classList.add("active");
        toggleButton.classList.add("active");
    }
}

// Toggle answer visibility in selection slide
function toggleSelectionAnswer(id, event) {
    event.stopPropagation(); // Prevent triggering parent click events

    const answerEl = document.getElementById(`selection-answer-${id}`);
    const toggleButton = event.currentTarget;

    if (answerEl.classList.contains("active")) {
        answerEl.classList.remove("active");
        toggleButton.classList.remove("active");
    } else {
        answerEl.classList.add("active");
        toggleButton.classList.add("active");
    }
}

// Toggle question selection
function toggleSelection(id, event) {
    event.stopPropagation(); // Prevent triggering parent click events

    const question = questions.find((q) => q.id === id);
    question.selected = !question.selected;

    // Update the UI
    const checkmark = event.target;
    if (question.selected) {
        checkmark.classList.add("selected");
        checkmark.textContent = "✓";
    } else {
        checkmark.classList.remove("selected");
        checkmark.textContent = "";
    }

    updateSelectedCount();
}

// Update the marks for a question
function updateMarks(id, value) {
    const question = questions.find((q) => q.id === id);
    question.marks = parseInt(value);
}

// Update the selected questions count
function updateSelectedCount() {
    const selectedCount = questions.filter((q) => q.selected).length;
    document.getElementById(
        "selectedInfo"
    ).textContent = `${selectedCount} question${selectedCount !== 1 ? "s" : ""
        } selected*`;
}

// Show the paper slide with selected questions
function showPaperSlide() {
    const selectedQuestions = questions.filter((q) => q.selected);
    if (selectedQuestions.length === 0) {
        alert("Please select at least one question.");
        return;
    }

    const paperContainer = document.getElementById("questionPaper");
    paperContainer.innerHTML = "";

    selectedQuestions.forEach((question, index) => {
        const questionEl = document.createElement("div");
        questionEl.className = "paper-question";
        questionEl.innerHTML = `
                    <div>${index + 1}.${question.text} ?</div>
                    <div class="mark-value">${question.marks}</div>
                `;
        paperContainer.appendChild(questionEl);
    });

    // Reset editing state
    paperContainer.contentEditable = "false";
    document.getElementById("addTextBtn").style.display = "inline-block";

    showSlide("slide3");
}

// Enable paper editing
function enableEditing() {
    const paper = document.getElementById("questionPaper");
    paper.contentEditable = "true";
    paper.focus();

    // Hide the "Add Text" button when editing
    document.getElementById("addTextBtn").style.display = "none";
}

// Show the final paper slide
function showFinalSlide() {
    const finalPaper = document.getElementById("finalPaper");
    const currentPaper = document.getElementById("questionPaper");
    const paperTitle = document.getElementById("paperTitle").value;

    finalPaper.innerHTML = currentPaper.innerHTML;
    document.getElementById("finalPaperTitle").textContent = paperTitle;
    showSlide("slide4");
}

// Update the module title based on PDF name
function updateModuleTitle(title) {
    document.getElementById("moduleTitle").textContent = title;
    document.getElementById("moduleTitle2").textContent = title;
}

// Show a specific slide
function showSlide(slideId) {
    document.querySelectorAll(".slide").forEach((slide) => {
        slide.style.display = "none";
    });
    document.getElementById(slideId).style.display = "block";
}

// Go back to previous page
function goBack() {
    // In a real application, this would navigate to the previous page
    alert("Navigate to previous page");
}