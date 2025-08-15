function toggleAnswer(btn) {
    const answerContent = btn.nextElementSibling;
    const isShowing = answerContent.classList.toggle("show");
    btn.innerHTML = isShowing
        ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"/>
            </svg> Hide Answer`
        : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
            </svg> Show Answer`;
}

function handleSelection() {
    const selectedQuestions = document.querySelectorAll(
        ".question-select:checked"
    );
    const generateBtn = document.getElementById("generateBtn");
    generateBtn.classList.toggle("show", selectedQuestions.length > 0);
}

function generatePDF() {
    // Get selected questions
    const selectedItems = Array.from(
        document.querySelectorAll(".question-select:checked")
    ).map((checkbox) => {
        const questionItem = checkbox.closest(".question-item");
        const questionText =
            questionItem.querySelector(".question-text").textContent;
        const marks = questionItem.querySelector(".marks-input").value;
        return { text: questionText, marks: marks };
    });

    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text("Question Paper", 105, 15, { align: "center" });

    // Add questions
    doc.setFontSize(12);
    let y = 30;
    selectedItems.forEach((item, index) => {
        // Add question number and text
        doc.text(`Q${index + 1}. ${item.text} [${item.marks} marks]`, 20, y);
        y += 20; // Move to next line

        // Add page if needed
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
    });

    // Add total marks
    const totalMarks = selectedItems.reduce(
        (sum, item) => sum + parseInt(item.marks),
        0
    );
    doc.text(`Total Marks: ${totalMarks}`, 20, y + 10);

    // Download PDF
    doc.save("question_paper.pdf");
}