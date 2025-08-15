const importModuleBtn = document.getElementById("importModuleBtn");
const moduleFileInput = document.getElementById("moduleFileInput");

importModuleBtn.addEventListener("click", function () {
  moduleFileInput.click();
});

moduleFileInput.addEventListener("change", function (event) {
  if (event.target.files.length > 0) {
    const file = event.target.files[0];

    // Display file name
    const fileNameDisplay = document.createElement("div");
    fileNameDisplay.className = "file-name-display";
    fileNameDisplay.textContent = `Selected file: ${file.name}`;

    // Remove any existing file name display
    const existingDisplay =
      importModuleBtn.parentNode.querySelector(".file-name-display");
    if (existingDisplay) {
      existingDisplay.remove();
    }

    // Append the file name display
    importModuleBtn.parentNode.appendChild(fileNameDisplay);

    // Here you would process the file based on its type
    processImportedFile(file);
  }
});

function processImportedFile(file) {
  // Check if file is PDF
  const fileType = file.name.split(".").pop().toLowerCase();

  if (fileType !== "pdf") {
    alert("Please select a PDF file");
    return;
  }

  // Display file name
  const fileNameDisplay = document.createElement("div");
  fileNameDisplay.className = "file-name-display";
  fileNameDisplay.textContent = `Selected file: ${file.name}`;

  // Remove any existing file name display
  const existingDisplay =
    importModuleBtn.parentNode.querySelector(".file-name-display");
  if (existingDisplay) {
    existingDisplay.remove();
  }

  // Append the file name display
  importModuleBtn.parentNode.appendChild(fileNameDisplay);

  // Add file to modules
  const moduleItems = [file.name];
  const existingModules = storage.get("moduleItems") || [];
  const updatedModules = [...existingModules, ...moduleItems];
  storage.save("moduleItems", updatedModules);
  updateModulesList();

  // Show success message
  alert(`Added ${file.name} successfully`);

  // Update the module message on home page
  moduleMsg.textContent = `PDF file imported successfully!`;
  storage.save("moduleMsg", moduleMsg.textContent);
}

// Add to your existing script section
function handleFileUpload(file) {
  const formData = new FormData();
  formData.append("file", file);

  fetch("/upload-pdf", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Show success message
        const msg = document.getElementById("moduleMsg");
        if (msg) {
          msg.textContent = `PDF file "${data.filename}" imported successfully!`;
        }
        location.reload(); // Refresh to show new uploads
      } else {
        alert(data.error || "Upload failed");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Upload failed");
    });
}

// Update the file input handler
document
  .getElementById("moduleFileInput")
  .addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  });
