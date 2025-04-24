let notes = JSON.parse(localStorage.getItem("notes") || "[]");
let currentTab = null;
let trash = JSON.parse(localStorage.getItem("trash") || "[]");
let selectedCategory = "";
let unsavedNote = null; // unsaved note variable
let openTabs = []; // new array tracking saved note tabs that are open

function stripHtml(html) {
  var tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || "";
}

function updateTabs() {
  const tabs = document.getElementById("tabs");
  tabs.innerHTML = "";
  // Show unsaved note tab if exists
  if (unsavedNote !== null) {
    const wrapper = document.createElement("div");
    wrapper.className = "note-tab d-flex justify-content-between align-items-center";
    if (currentTab === "unsaved") wrapper.classList.add("active");
    wrapper.onclick = () => { openUnsavedNote(); };
    const span = document.createElement("span");
    const unsavedTitle = unsavedNote.title ? stripHtml(unsavedNote.title) : "";
    span.textContent = unsavedTitle.length > 15 ? unsavedTitle.substring(0,15) + "..." : (unsavedTitle || "New Note");
    const closeBtn = document.createElement("span");
    // Updated cross icon for close tab
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    closeBtn.style.color = "red";
    closeBtn.style.cursor = "pointer";
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Discard unsaved note?")) {
        unsavedNote = null;
        if (currentTab === "unsaved") currentTab = null;
        updateTabs();
        showMainMenu();
      }
    };
    wrapper.appendChild(span);
    wrapper.appendChild(closeBtn);
    tabs.appendChild(wrapper);
  }
  // Show saved note tabs that are open
  openTabs.forEach(index => {
    if (notes[index]) {
      const wrapper = document.createElement("div");
      wrapper.className = "note-tab d-flex justify-content-between align-items-center";
      if (currentTab === index) wrapper.classList.add("active");
      wrapper.onclick = () => { openNote(index); };
      const span = document.createElement("span");
      const savedTitle = notes[index].title ? stripHtml(notes[index].title) : "";
      span.textContent = savedTitle.length > 15 ? savedTitle.substring(0,15) + "..." : (savedTitle || "No Title");
      const closeBtn = document.createElement("span");
      // Updated cross icon for close tab
      closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      closeBtn.style.color = "red";
      closeBtn.style.cursor = "pointer";
      closeBtn.onclick = (e) => {
        e.stopPropagation();
          openTabs = openTabs.filter(i => i !== index);
          if (currentTab === index) currentTab = null;
          updateTabs();
          showMainMenu();
      };
      wrapper.appendChild(span);
      wrapper.appendChild(closeBtn);
      tabs.appendChild(wrapper);
    }
  });
}

function newNote() {
  // For new note, create an unsavedNote and open its editor
  unsavedNote = { title: "", content: "", favorite: false, category: "" };
  currentTab = "unsaved";
  document.getElementById("noteTitle").value = "";
  document.getElementById("noteContent").innerHTML = "";
  document.getElementById("mainMenu").style.display = "none";
  document.getElementById("noteEditor").style.display = "block";
  updateTabs();
}

function openUnsavedNote() {
  currentTab = "unsaved";
  document.getElementById("noteTitle").value = unsavedNote.title;
  document.getElementById("noteContent").innerHTML = unsavedNote.content;
  document.getElementById("mainMenu").style.display = "none";
  document.getElementById("noteEditor").style.display = "block";
  updateTabs();
}

function showMainMenu() {
  document.getElementById("mainMenu").style.display = "block";
  document.getElementById("categoryNotesView").style.display = "none";
  document.getElementById("noteEditor").style.display = "none";
  document.getElementById("trashBin").style.display = "none";
  renderMainCards();
}

function renderMainCards() {
  const container = document.getElementById("mainCards");
  container.innerHTML = "";

  // Render categories as cards with distinct styling
  const categories = {};
  notes.forEach(note => {
    if (note.category) {
      categories[note.category] = categories[note.category] || [];
      categories[note.category].push(note);
    }
  });

  Object.keys(categories).forEach(category => {
    const col = document.createElement("div");
    col.className = "col-3 mb-3"; // Maintain 4 cards per row
    const notesInCategory = categories[category];
    const noteTitles = notesInCategory
      .slice(0, 3) // Limit to 3 titles
      .map(note => {
        let titleText = note.title ? stripHtml(note.title) : "Untitled Note";
        return `- ${titleText.length > 10 ? titleText.substring(0,10) + "..." : titleText}`;
      })
      .join("<br>");
    const moreIndicator = notesInCategory.length > 3 ? "<br>..." : ""; // Add "..." only if there are more than 3 notes

    // Check if category is pinned
    const isPinned = notes.some(n => n.category === category && n.categoryPinned);
    const pinIcon = isPinned ? '<i class="fa-solid fa-thumbtack"></i>' : "";
    
    col.innerHTML = `
      <div class="card category-square" onclick="showCategoryNotes('${category}')" 
           style="background-color: #f0f7ff; border-left: 4px solid #5c9cff;">
        <div class="card-header" style="background-color: #e1edff; font-weight: bold;">
          <i class="fa-solid fa-folder"></i> Category
        </div>
        <div class="card-body" style="text-align: left; margin-bottom: 2rem; margin-right: 2rem;">
          ${noteTitles}${moreIndicator}
        </div>
        <div class="card-footer text-muted d-flex justify-content-between align-items-center">
          <div class="d-flex justify-content-between align-items-center w-100">
            <div>
              ${pinIcon} <i class="fa-solid fa-folder-open"></i> ${category.length > 15 ? category.substring(0,15) + "..." : category}<br>
              ${notesInCategory.length} notes
            </div>
            <div class="dropdown" onclick="event.stopPropagation();">
              <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                ⋮
              </button>
              <ul class="dropdown-menu">
                <li><button class="dropdown-item" onclick="togglePinCategory('${category}')">${isPinned ? 'Unpin Category' : 'Pin Category'}</button></li>
                <li><button class="dropdown-item" onclick="changeCategoryName('${category}')">Change Name</button></li>
                <li><button class="dropdown-item" onclick="deleteCategory('${category}')">Delete</button></li>
              </ul>
            </div>
          </div>
        </div>
      </div>`;
    container.appendChild(col);
  });

  // Render uncategorized notes as cards with distinct styling
  const uncategorizedNotes = notes.filter(note => !note.category);
  uncategorizedNotes.forEach(note => {
    const col = document.createElement("div");
    col.className = "col-3 mb-3"; // Maintain 4 cards per row
    const plainText = stripHtml(note.content);
    const noteContentPreview = plainText.length > 30 ? plainText.substring(0, 70) + "..." : plainText;
    const globalIndex = notes.indexOf(note); // Get the correct index
    const limitedTitle = note.title ? 
                        (stripHtml(note.title).length > 15 ? stripHtml(note.title).substring(0, 15) + "..." : stripHtml(note.title)) 
                        : "No Title";
    
    col.innerHTML = `
      <div class="card" onclick="openNote(${globalIndex})" 
           style="background-color: #fffbf0; border-left: 4px solid #ffd280;">
        <div class="card-header" style="background-color: #fff5d6; font-weight: bold;">
          <i class="fa-solid fa-file-lines"></i> Note
        </div>
        <div class="card-body" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; word-wrap: break-word; word-break: break-word; hyphens: auto; text-align: left;">
          ${noteContentPreview}
        </div>
        <div class="card-footer text-muted d-flex justify-content-between align-items-center">
          <div class="d-flex justify-content-between align-items-center w-100">
            <div>${note.favorite ? '<i class="fa-solid fa-thumbtack"></i> ' : ''}<i class="fa-solid fa-file-lines"></i> ${limitedTitle}</div>
            <div class="dropdown">
              <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" onclick="event.stopPropagation();">
                ⋮
              </button>
              <ul class="dropdown-menu">
                <li><button class="dropdown-item" onclick="event.stopPropagation(); togglePinNote(${globalIndex})">${note.favorite ? '<i class="fa-solid fa-thumbtack"></i> Unpin' : '<i class="fa-solid fa-thumbtack"></i> Pin'}</button></li>
                <li><button class="dropdown-item" onclick="event.stopPropagation(); changeNoteName(${globalIndex})">Change Name</button></li>
                <li><button class="dropdown-item" onclick="event.stopPropagation(); deleteNote(${globalIndex})">Delete</button></li>
              </ul>
            </div>
          </div>
        </div>
      </div>`;
    container.appendChild(col);
  });
}

function togglePinNote(index) {
  if (index >= 0 && index < notes.length) {
    notes[index].favorite = !notes[index].favorite;
    localStorage.setItem("notes", JSON.stringify(notes));
    renderMainCards();
    // Refresh pins immediately upon pin toggling
    const pins = document.getElementById("pinsContainer");
    if (pins.style.display === "block") {
      renderPins();
    }
  }
}

function filterFavorites() {
  document.getElementById("mainMenu").style.display = "block";
  document.getElementById("categoryNotesView").style.display = "none";
  document.getElementById("noteEditor").style.display = "none";
  document.getElementById("trashBin").style.display = "none";

  const container = document.getElementById("mainCards");
  container.innerHTML = "";
  
  // Header with back button
  const headerDiv = document.createElement("div");
  headerDiv.className = "d-flex justify-content-between align-items-center mb-3";
  
  const header = document.createElement("h4");
  header.innerHTML = `<i class="fa-solid fa-thumbtack"></i> Pinned Items`;
  headerDiv.appendChild(header);
  
  const backBtn = document.createElement("button");
  backBtn.className = "btn btn-outline-secondary";
  backBtn.innerHTML = "← Back";
  backBtn.onclick = showMainMenu;
  headerDiv.appendChild(backBtn);
  
  container.appendChild(headerDiv);

  // Pinned Notes
  const pinnedNotes = notes.filter(n => n.favorite);
  if (pinnedNotes.length > 0) {
    const notesHeader = document.createElement("h5");
    notesHeader.textContent = "Pinned Notes";
    notesHeader.className = "mt-3 mb-2";
    container.appendChild(notesHeader);

    const notesRow = document.createElement("div");
    notesRow.className = "row";
    
    pinnedNotes.forEach(note => {
      const col = document.createElement("div");
      col.className = "col-3 mb-3";
      const plainText = stripHtml(note.content);
      const noteContentPreview = plainText.length > 30 ? plainText.substring(0, 70) + "..." : plainText;
      const globalIndex = notes.indexOf(note);
      // Limit title to 15 characters
      const titleText = note.title ? stripHtml(note.title) : "No Title";
      const limitedTitle = titleText.length > 15 ? titleText.substring(0, 15) + "..." : titleText;
      
      col.innerHTML = `
        <div class="card" onclick="openNote(${globalIndex})" 
             style="background-color: #fffbf0; border-left: 4px solid #ffd280;">
          <div class="card-header" style="background-color: #fff5d6; font-weight: bold;">
            <i class="fa-solid fa-file-lines"></i> Note
          </div>
          <div class="card-body" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; word-wrap: break-word; word-break: break-word; hyphens: auto; text-align: left;">
            ${noteContentPreview}
          </div>
          <div class="card-footer text-muted">
            <div class="d-flex justify-content-between align-items-center w-100">
              <div><i class="fa-solid fa-thumbtack"></i> <i class="fa-solid fa-file-lines"></i> ${limitedTitle}</div>
              <div class="dropdown" onclick="event.stopPropagation();">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  ⋮
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><button class="dropdown-item" onclick="event.stopPropagation(); togglePinNote(${globalIndex})">Unpin</button></li>
                  <li><button class="dropdown-item" onclick="event.stopPropagation(); openNote(${globalIndex})">Open</button></li>
                </ul>
              </div>
            </div>
          </div>
        </div>`;
      notesRow.appendChild(col);
    });
    container.appendChild(notesRow);
  }

  // Pinned Categories
  const pinnedCategories = [];
  notes.forEach(note => {
    if (note.category && note.categoryPinned && !pinnedCategories.includes(note.category)) {
      pinnedCategories.push(note.category);
    }
  });

  if (pinnedCategories.length > 0) {
    const catHeader = document.createElement("h5");
    catHeader.textContent = "Pinned Categories";
    catHeader.className = "mt-4 mb-2";
    container.appendChild(catHeader);

    const catRow = document.createElement("div");
    catRow.className = "row";
    
    pinnedCategories.forEach(category => {
      const col = document.createElement("div");
      col.className = "col-3 mb-3";
      const notesInCategory = notes.filter(note => note.category === category);
      
      const noteTitles = notesInCategory
        .slice(0, 3)
        .map(note => {
          let titleText = note.title ? stripHtml(note.title) : "Untitled Note";
          return `- ${titleText.length > 10 ? titleText.substring(0,10) + "..." : titleText}`;
        })
        .join("<br>");
      const moreIndicator = notesInCategory.length > 3 ? "<br>..." : "";
      
      // Limit category name to 15 characters
      const limitedCategory = category.length > 15 ? category.substring(0,15) + "..." : category;
      
      col.innerHTML = `
        <div class="card category-square" onclick="showCategoryNotes('${category}')" 
             style="background-color: #f0f7ff; border-left: 4px solid #5c9cff;">
          <div class="card-header" style="background-color: #e1edff; font-weight: bold;">
            <i class="fa-solid fa-folder"></i> Category
          </div>
          <div class="card-body" style="text-align: left; margin-bottom: 2rem; margin-right: 2rem;">
            ${noteTitles}${moreIndicator}
          </div>
          <div class="card-footer text-muted">
            <div class="d-flex justify-content-between align-items-center w-100">
              <div>
                <i class="fa-solid fa-thumbtack"></i> <i class="fa-solid fa-folder-open"></i> ${limitedCategory}<br>
                ${notesInCategory.length} notes
              </div>
              <div class="dropdown" onclick="event.stopPropagation();">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  ⋮
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><button class="dropdown-item" onclick="event.stopPropagation(); togglePinCategory('${category}')">Unpin Category</button></li>
                  <li><button class="dropdown-item" onclick="event.stopPropagation(); showCategoryNotes('${category}')">Open</button></li>
                </ul>
              </div>
            </div>
          </div>
        </div>`;
      catRow.appendChild(col);
    });
    container.appendChild(catRow);
  }

  if (pinnedNotes.length === 0 && pinnedCategories.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "alert alert-info mt-3";
    emptyMsg.textContent = "No pinned items found. Pin notes or categories to see them here.";
    container.appendChild(emptyMsg);
  }
}

function togglePinCategory(category) {
  event.stopPropagation();
  const isPinned = notes.some(n => n.category === category && n.categoryPinned);
  notes.forEach(note => {
    if (note.category === category) {
      note.categoryPinned = !isPinned;
    }
  });
  localStorage.setItem("notes", JSON.stringify(notes));
  renderMainCards();
  // Refresh pins immediately upon category pin toggle
  const pins = document.getElementById("pinsContainer");
  if (pins.style.display === "block") {
    renderPins();
  }
}

function showAllNotes() {
  document.getElementById("mainMenu").style.display = "block";
  document.getElementById("categoryNotesView").style.display = "none";
  document.getElementById("noteEditor").style.display = "none";
  document.getElementById("trashBin").style.display = "none";

  const container = document.getElementById("mainCards");
  container.innerHTML = "";
  
  // Header with back button
  const headerDiv = document.createElement("div");
  headerDiv.className = "d-flex justify-content-between align-items-center mb-3";
  
  const header = document.createElement("h4");
  header.innerHTML = `<i class="fa-solid fa-book"></i> All Notes`;
  headerDiv.appendChild(header);
  
  const backBtn = document.createElement("button");
  backBtn.className = "btn btn-outline-secondary";
  backBtn.innerHTML = "← Back";
  backBtn.onclick = showMainMenu;
  headerDiv.appendChild(backBtn);
  
  container.appendChild(headerDiv);

  if (notes.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "alert alert-info mt-3";
    emptyMsg.textContent = "No notes found. Create a new note to get started.";
    container.appendChild(emptyMsg);
    return;
  }

  const notesRow = document.createElement("div");
  notesRow.className = "row";
  
  notes.forEach(note => {
    const col = document.createElement("div");
    col.className = "col-3 mb-3";
    const plainText = stripHtml(note.content);
    const noteContentPreview = plainText.length > 30 ? plainText.substring(0, 70) + "..." : plainText;
    const globalIndex = notes.indexOf(note);
    
    // Limit title to 15 characters
    const titleText = note.title ? stripHtml(note.title) : "No Title";
    const limitedTitle = titleText.length > 15 ? titleText.substring(0, 15) + "..." : titleText;
    
    // Limit category name to 10 characters if exists
    const categoryDisplay = note.category ? 
      `<div class="mt-1"><span class="badge bg-light text-dark">${note.category.length > 10 ? note.category.substring(0,10) + "..." : note.category}</span></div>` 
      : '';
    
    col.innerHTML = `
      <div class="card" onclick="openNote(${globalIndex})" 
           style="background-color: #fffbf0; border-left: 4px solid #ffd280;">
        <div class="card-header" style="background-color: #fff5d6; font-weight: bold;">
          <i class="fa-solid fa-file-lines"></i> Note
        </div>
        <div class="card-body" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; word-wrap: break-word; word-break: break-word; hyphens: auto; text-align: left;">
          ${noteContentPreview}
        </div>
        <div class="card-footer text-muted">
          <div class="d-flex justify-content-between align-items-center w-100">
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <div>${note.favorite ? '<i class="fa-solid fa-thumbtack"></i> ' : ''}<i class="fa-solid fa-file-lines"></i> ${limitedTitle}</div>
              ${categoryDisplay}
            </div>
            <div class="dropdown" onclick="event.stopPropagation();">
              <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                ⋮
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><button class="dropdown-item" onclick="event.stopPropagation(); togglePinNote(${globalIndex})">${note.favorite ? '<i class="fa-solid fa-thumbtack"></i> Unpin' : '<i class="fa-solid fa-thumbtack"></i> Pin'}</button></li>
                <li><button class="dropdown-item" onclick="event.stopPropagation(); changeNoteName(${globalIndex})">Change Name</button></li>
                <li><button class="dropdown-item" onclick="event.stopPropagation(); deleteNote(${globalIndex})">Delete</button></li>
              </ul>
            </div>
          </div>
        </div>
      </div>`;
    notesRow.appendChild(col);
  });
  container.appendChild(notesRow);
}

function showCategoryNotes(category) {
  const container = document.getElementById("categoryNotes");
  container.innerHTML = "";
  const notesInCategory = notes.filter(note => note.category === category);

  // Add header with category name
  const headerDiv = document.createElement("div");
  headerDiv.className = "d-flex justify-content-between align-items-center col-12 mb-3";
  
  const header = document.createElement("h4");
  // Limit displayed category name if too long
  const displayCategory = category.length > 20 ? category.substring(0,20) + "..." : category;
  header.innerHTML = `<i class="fa-solid fa-folder-open"></i> ${displayCategory}`;
  headerDiv.appendChild(header);
  
  container.appendChild(headerDiv);

  notesInCategory.forEach((note, index) => {
    const col = document.createElement("div");
    col.className = "col-3 mb-3"; // Maintain 4 cards per row
    const plainText = stripHtml(note.content);
    const noteContentPreview = plainText.length > 70 ? plainText.substring(0,70) + "..." : plainText;
    const globalIndex = notes.indexOf(note);
    
    // Limit title to 15 characters
    const titleText = note.title ? stripHtml(note.title) : "No Title";
    const limitedTitle = titleText.length > 15 ? titleText.substring(0, 15) + "..." : titleText;
  
    col.innerHTML = `
      <div class="card" onclick="openNoteFromCategory('${category}', ${index})" 
           style="background-color: #fffbf0; border-left: 4px solid #ffd280;">
        <div class="card-header" style="background-color: #fff5d6; font-weight: bold;">
          <i class="fa-solid fa-file-lines"></i> Note
        </div>
        <div class="card-body" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; word-wrap: break-word; word-break: break-word; hyphens: auto; text-align: left;">
          ${noteContentPreview}
        </div>
        <div class="card-footer text-muted">
          <div class="d-flex justify-content-between align-items-center w-100">
            <div>${note.favorite ? '<i class="fa-solid fa-thumbtack"></i> ' : ''}<i class="fa-solid fa-file-lines"></i> ${limitedTitle}</div>
            <div class="dropdown" onclick="event.stopPropagation();">
              <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" onclick="event.stopPropagation();">
                ⋮
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><button class="dropdown-item" onclick="event.stopPropagation(); togglePinNote(${globalIndex})">${note.favorite ? '<i class="fa-solid fa-thumbtack"></i> Unpin' : '<i class="fa-solid fa-thumbtack"></i> Pin'}</button></li>
                <li><button class="dropdown-item" onclick="event.stopPropagation(); changeNoteNameInCategory('${category}', ${index})">Change Name</button></li>
                <li><button class="dropdown-item" onclick="event.stopPropagation(); deleteNoteFromCategory('${category}', ${index})">Delete</button></li>
              </ul>
            </div>
          </div>
        </div>
      </div>`;
    container.appendChild(col);
  });

  document.getElementById("mainMenu").style.display = "none";
  document.getElementById("categoryNotesView").style.display = "block";
}

function openNoteFromCategory(category, index) {
  const notesInCategory = notes.filter(note => note.category === category);
  const note = notesInCategory[index];
  const noteIndex = notes.indexOf(note);
  openNote(noteIndex);
}

function openNote(index) {
  currentTab = index;
  // Add the note to openTabs if not already there.
  if (!openTabs.includes(index)) {
    openTabs.push(index);
  }
  const note = notes[index];
  document.getElementById("noteTitle").value = note.title;
  document.getElementById("noteContent").innerHTML = note.content;
  document.getElementById("mainMenu").style.display = "none";
  document.getElementById("categoryNotesView").style.display = "none";
  document.getElementById("noteEditor").style.display = "block";
  document.getElementById("trashBin").style.display = "none";
  updateTabs();
}

function saveNote() {
  try {
    // Make sure the selectedCategory is always reset when opening save dialog
    selectedCategory = currentTab !== "unsaved" && notes[currentTab] && notes[currentTab].category ? 
      notes[currentTab].category : "";
    
    // Populate categories
    populateCategoryList();
    
    // Highlight selected category or "Without Category"
    if (selectedCategory) {
      highlightSelectedCategory(selectedCategory);
    } else {
      highlightSelectedCategory("Without Category");
    }
    
    // Clear any previous new category input
    document.getElementById("newCategoryInput").value = "";
    
    // Use Bootstrap's Modal to show the save dialog
    const saveModal = new bootstrap.Modal(document.getElementById("saveModal"));
    saveModal.show();
  } catch (error) {
    console.error("Error in saveNote:", error);
    // Fallback direct save without modal if there's an error
    directSave();
  }
}

// Add this function before (or after) the saveNote() function
function populateCategoryList() {
  const container = document.getElementById("saveModalCategories");
  container.innerHTML = "";
  // Gather unique categories that exist in notes
  const categories = [...new Set(notes.map(note => note.category).filter(c => c))];
  // Add a default option to represent no category
  categories.unshift("Without Category");
  categories.forEach(category => {
    const btn = document.createElement("button");
    btn.textContent = category;
    btn.className = "btn btn-outline-primary btn-sm m-1";
    btn.onclick = () => {
      selectedCategory = category === "Without Category" ? "" : category;
      highlightSelectedCategory(category);
    };
    container.appendChild(btn);
  });
}

// Add a direct save function as fallback
function directSave() {
  if (currentTab === "unsaved") {
    unsavedNote.title = document.getElementById("noteTitle").value;
    unsavedNote.content = document.getElementById("noteContent").innerHTML;
    notes.push(unsavedNote);
    let newIndex = notes.length - 1;
    currentTab = newIndex;
    if (!openTabs.includes(newIndex)) {
      openTabs.push(newIndex);
    }
    unsavedNote = null;
  } else if (currentTab !== null && notes[currentTab]) {
    notes[currentTab].title = document.getElementById("noteTitle").value;
    notes[currentTab].content = document.getElementById("noteContent").innerHTML;
  }
  
  localStorage.setItem("notes", JSON.stringify(notes));
  alert("Note saved.");
  updateTabs();
  showMainMenu();
}

function addCategory() {
  const newCategoryInput = document.getElementById("newCategoryInput");
  const newCategory = newCategoryInput.value.trim();
  
  if (newCategory) {
    selectedCategory = newCategory;
    highlightSelectedCategory(newCategory);
    
    // Add the new category button
    const container = document.getElementById("saveModalCategories");
    const existingButtons = Array.from(container.children);
    
    // Check if this category already exists
    if (!existingButtons.some(btn => btn.textContent === newCategory)) {
      const btn = document.createElement("button");
      btn.textContent = newCategory;
      btn.className = "btn btn-outline-primary btn-sm m-1";
      btn.onclick = () => {
        selectedCategory = newCategory;
        highlightSelectedCategory(newCategory);
      };
      container.appendChild(btn);
    }
    
    // Clear the input
    newCategoryInput.value = "";
    
    // Select the new category
    highlightSelectedCategory(newCategory);
  }
}

function highlightSelectedCategory(category) {
  const container = document.getElementById("saveModalCategories");
  const buttons = container.querySelectorAll("button");
  
  buttons.forEach(btn => {
    if (btn.textContent === category) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

document.getElementById("noteContent").addEventListener("input", () => {
  if (currentTab !== null) {
    if (currentTab === "unsaved") {
      unsavedNote.content = document.getElementById("noteContent").innerHTML;
    } else {
      notes[currentTab].content = document.getElementById("noteContent").innerHTML;
    }
    localStorage.setItem("notes", JSON.stringify(notes));
    updateTabs();
  }
});

document.getElementById("noteTitle").addEventListener("input", () => {
  if (currentTab !== null) {
    if (currentTab === "unsaved") {
      unsavedNote.title = document.getElementById("noteTitle").value;
    } else {
      notes[currentTab].title = document.getElementById("noteTitle").value;
    }
    localStorage.setItem("notes", JSON.stringify(notes));
    updateTabs();
  }
});

function toggleFavorite() {
  if (currentTab !== null) {
    if (currentTab === "unsaved") {
      unsavedNote.favorite = !unsavedNote.favorite;
    } else {
      notes[currentTab].favorite = !notes[currentTab].favorite;
    }
    localStorage.setItem("notes", JSON.stringify(notes));
    updateTabs();
  }
}

function showTrash() {
  // First, make sure all other views are hidden
  document.getElementById("mainMenu").style.display = "none";
  document.getElementById("categoryNotesView").style.display = "none";
  document.getElementById("noteEditor").style.display = "none";
  document.getElementById("trashBin").style.display = "block"; // Make sure trash is visible
  
  const container = document.getElementById("trashBin");
  container.innerHTML = ""; // Clear existing content
  
  // Add header and clear trash button
  const headerDiv = document.createElement("div");
  headerDiv.className = "d-flex justify-content-between align-items-center mb-3";
  
  const header = document.createElement("h4");
  header.innerHTML = `<i class="fa-solid fa-trash-can"></i> Trash`;
  headerDiv.appendChild(header);
  
  const clearBtn = document.createElement("button");
  clearBtn.className = "btn btn-danger";
  clearBtn.innerHTML = "Empty Trash";
  clearBtn.onclick = clearTrash;
  headerDiv.appendChild(clearBtn);
  
  container.appendChild(headerDiv);
  
  // Back button
  const backBtn = document.createElement("button");
  backBtn.className = "btn btn-outline-secondary mb-3";
  backBtn.innerHTML = "← Back to Main";
  backBtn.onclick = showMainMenu;
  container.appendChild(backBtn);
  
  if (trash.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "alert alert-info mt-3";
    emptyMsg.textContent = "Trash is empty.";
    container.appendChild(emptyMsg);
  } else {
    // Group items by type
    const deletedNotes = trash.filter(item => item.content !== undefined && !item.isCategory);
    const deletedCategories = trash.filter(item => item.isCategory || (item.content === undefined && item.name));
    
    // Create a container for cards
    const trashContent = document.createElement("div");
    trashContent.className = "row";
    
    // Display deleted notes
    if (deletedNotes.length > 0) {
      const notesHeader = document.createElement("h5");
      notesHeader.textContent = "Deleted Notes";
      notesHeader.className = "col-12 mt-3 mb-2";
      trashContent.appendChild(notesHeader);
      
      deletedNotes.forEach((note, index) => {
        const col = document.createElement("div");
        col.className = "col-3 mb-3";
        const plainText = stripHtml(note.content || "");
        const noteContentPreview = plainText.length > 30 ? plainText.substring(0, 70) + "..." : plainText;
        const limitedTitle = note.title ? 
          (stripHtml(note.title).length > 15 ? stripHtml(note.title).substring(0, 15) + "..." : stripHtml(note.title)) 
          : "No Title";
          
        col.innerHTML = `
          <div class="card" style="background-color: #f8f8f8; border-left: 4px solid #aaaaaa;">
            <div class="card-header" style="background-color: #eeeeee; font-weight: bold;">
              <i class="fa-solid fa-file-lines"></i> Deleted Note
            </div>
            <div class="card-body" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; word-wrap: break-word; word-break: break-word; hyphens: auto; text-align: left;">
              ${noteContentPreview}
            </div>
            <div class="card-footer text-muted">
              <div class="d-flex justify-content-between align-items-center w-100">
                <div class="text-truncate me-2" style="max-width: 150px;" title="${note.title || 'No Title'}">
                  <i class="fa-solid fa-file-lines"></i> ${limitedTitle}
                </div>
                <div class="d-flex">
                  <button class="btn btn-sm btn-success me-1" onclick="restoreFromTrash('note', ${index})">
                    <i class="fa-solid fa-rotate-left"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="deletePermanently('note', ${index})">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>`;
        trashContent.appendChild(col);
      });
    }
    
    // Display deleted categories
    if (deletedCategories.length > 0) {
      const catsHeader = document.createElement("h5");
      catsHeader.textContent = "Deleted Categories";
      catsHeader.className = "col-12 mt-4 mb-2";
      trashContent.appendChild(catsHeader);
      
      deletedCategories.forEach((category, index) => {
        const col = document.createElement("div");
        col.className = "col-3 mb-3";
        const limitedName = category.name ? 
          (category.name.length > 15 ? category.name.substring(0, 15) + "..." : category.name) 
          : "Unnamed Category";
        
        col.innerHTML = `
          <div class="card" style="background-color: #f8f8f8; border-left: 4px solid #aaaaaa;">
            <div class="card-header" style="background-color: #eeeeee; font-weight: bold;">
              <i class="fa-solid fa-folder"></i> Deleted Category
            </div>
            <div class="card-body text-center">
              <h5 class="text-truncate" title="${category.name || 'Unnamed Category'}">${limitedName}</h5>
              <p class="text-muted">${category.noteCount || 0} notes were in this category</p>
            </div>
            <div class="card-footer text-muted">
              <div class="d-flex justify-content-between align-items-center w-100">
                <div class="text-truncate me-2" style="max-width: 150px;" title="${category.name || 'Unnamed Category'}">
                  <i class="fa-solid fa-folder"></i> ${limitedName}
                </div>
                <div class="d-flex">
                  <button class="btn btn-sm btn-success me-1" onclick="restoreFromTrash('category', ${index})">
                    <i class="fa-solid fa-rotate-left"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="deletePermanently('category', ${index})">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>`;
        trashContent.appendChild(col);
      });
    }
    
    container.appendChild(trashContent);
  }
}

function restoreFromTrash(type, index) {
    if (type === 'note') {
      // Find notes with content property (that aren't categories)
      const deletedNotes = trash.filter(item => item.content !== undefined && !item.isCategory);
      if (index >= 0 && index < deletedNotes.length) {
        const noteToRestore = deletedNotes[index];
        
        // Find the original item in the trash array
        const trashIndex = trash.findIndex(item => item === noteToRestore);
        
        // Add back to notes array
        notes.push(noteToRestore);
        
        // Remove from trash
        if (trashIndex !== -1) {
          trash.splice(trashIndex, 1);
        }
        
        // Update storage
        localStorage.setItem("notes", JSON.stringify(notes));
        localStorage.setItem("trash", JSON.stringify(trash));
        
        // Refresh views
        updateTabs();
        renderMainCards();
        // Refresh worksplace if visible
        const worksplace = document.getElementById("worksplaceContainer");
        if (worksplace.style.display === "block") {
          renderWorksplace();
        }
        // Refresh pins if visible
        const pins = document.getElementById("pinsContainer");
        if (pins.style.display === "block") {
          renderPins();
        }
        
        // Refresh trash view
        showTrash();
      }
    } else if (type === 'category') {
      // Find categories
      const deletedCategories = trash.filter(item => item.isCategory || (item.content === undefined && item.name));
      if (index >= 0 && index < deletedCategories.length) {
        const categoryToRestore = deletedCategories[index];
        
        // Find the original item in the trash array
        const trashIndex = trash.findIndex(item => item === categoryToRestore);
        
        // Create a new category with the same name
        const categoryName = categoryToRestore.name || "Restored Category";
        
        // If there are notes that belonged to this category, restore them too
        if (categoryToRestore.notes && Array.isArray(categoryToRestore.notes)) {
          categoryToRestore.notes.forEach(note => {
            note.category = categoryName;
            notes.push(note);
          });
        }
        
        // Remove from trash
        if (trashIndex !== -1) {
          trash.splice(trashIndex, 1);
        }
        
        // Update storage
        localStorage.setItem("notes", JSON.stringify(notes));
        localStorage.setItem("trash", JSON.stringify(trash));
        
        // Refresh views
        updateTabs();
        renderMainCards();
        const worksplace = document.getElementById("worksplaceContainer");
        if (worksplace.style.display === "block") {
          renderWorksplace();
        }
        const pins = document.getElementById("pinsContainer");
        if (pins.style.display === "block") {
          renderPins();
        }
        
        // Refresh trash view
        showTrash();
      }
    }
  }

function deletePermanently(type, index) {
  if (!confirm("Are you sure you want to permanently delete this item? This action cannot be undone.")) {
    return;
  }
  
  if (type === 'note') {
    // Find notes with content property (that aren't categories)
    const deletedNotes = trash.filter(item => item.content !== undefined && !item.isCategory);
    if (index >= 0 && index < deletedNotes.length) {
      const noteToDelete = deletedNotes[index];
      
      // Find the original item in the trash array
      const trashIndex = trash.findIndex(item => item === noteToDelete);
      
      // Remove from trash
      if (trashIndex !== -1) {
        trash.splice(trashIndex, 1);
      }
    }
  } else if (type === 'category') {
    // Find categories
    const deletedCategories = trash.filter(item => item.isCategory || (item.content === undefined && item.name));
    if (index >= 0 && index < deletedCategories.length) {
      const categoryToDelete = deletedCategories[index];
      
      // Find the original item in the trash array
      const trashIndex = trash.findIndex(item => item === categoryToDelete);
      
      // Remove from trash
      if (trashIndex !== -1) {
        trash.splice(trashIndex, 1);
      }
    }
  }
  
  localStorage.setItem("trash", JSON.stringify(trash));
  showTrash();
}

function clearTrash() {
  if (trash.length === 0) {
    alert("Trash is already empty.");
    return;
  }
  
  if (confirm("Are you sure you want to permanently delete all items in the trash? This action cannot be undone.")) {
    trash = [];
    localStorage.setItem("trash", JSON.stringify(trash));
    showTrash();
  }
}

function deleteCategory(category) {
  if (confirm(`Are you sure you want to delete category "${category}" and move all its notes to trash?`)) {
    const notesInCategory = notes.filter(note => note.category === category);
    
    // Create a category object to store in trash
    const categoryObj = {
      name: category,
      noteCount: notesInCategory.length,
      notes: notesInCategory.slice(), // store copies of the notes
      isCategory: true // Add a flag to identify this as a category
    };
    
    // Only add the category object to trash, not individual notes
    trash.push(categoryObj);
    
    // Remove notes from the active notes list
    notes = notes.filter(note => note.category !== category);
    localStorage.setItem("notes", JSON.stringify(notes));
    localStorage.setItem("trash", JSON.stringify(trash));
    updateTabs();
    // Refresh workspace and pins immediately
    const worksplace = document.getElementById("worksplaceContainer");
    const pins = document.getElementById("pinsContainer");
    if (worksplace.style.display === "block") {
      renderWorksplace();
    }
    if (pins.style.display === "block") {
      renderPins();
    }
    showMainMenu();
  }
}

function changeCategoryName(category) {
  alert(`Change name for category "${category}" feature coming soon.`);
  // Placeholder for future implementation
}

function deleteNote(index) {
  if (confirm("Are you sure you want to move this note to trash?")) {
    trash.push(notes[index]);
    notes.splice(index, 1);
    localStorage.setItem("notes", JSON.stringify(notes));
    localStorage.setItem("trash", JSON.stringify(trash));
    updateTabs();
    // Refresh workspace and pins immediately
    const worksplace = document.getElementById("worksplaceContainer");
    const pins = document.getElementById("pinsContainer");
    if (worksplace.style.display === "block") {
      renderWorksplace();
    }
    if (pins.style.display === "block") {
      renderPins();
    }
    showMainMenu();
  }
}

function changeNoteName(index) {
  alert(`Change name for note "${notes[index].title}" feature coming soon.`);
  // Placeholder for future implementation
}

function changeNoteNameInCategory(category, index) {
  const notesInCategory = notes.filter(note => note.category === category);
  
  if (index >= 0 && index < notesInCategory.length) {
    const note = notesInCategory[index];
    const globalIndex = notes.findIndex(n => n === note);
    
    if (globalIndex !== -1) {
      changeNoteName(globalIndex);
    }
  }
}

function deleteNoteFromCategory(category, index) {
  const notesInCategory = notes.filter(note => note.category === category);
  
  if (index >= 0 && index < notesInCategory.length) {
    const note = notesInCategory[index];
    const globalIndex = notes.findIndex(n => n === note);
    
    if (globalIndex !== -1 && confirm("Are you sure you want to move this note to trash?")) {
      trash.push(notes[globalIndex]);
      notes.splice(globalIndex, 1);
      localStorage.setItem("notes", JSON.stringify(notes));
      localStorage.setItem("trash", JSON.stringify(trash));
      updateTabs();
      // Refresh workspace and pins immediately
      const worksplace = document.getElementById("worksplaceContainer");
      const pins = document.getElementById("pinsContainer");
      if (worksplace.style.display === "block") {
        renderWorksplace();
      }
      if (pins.style.display === "block") {
        renderPins();
      }
      showCategoryNotes(category);
    }
  }
}

function toggleWorksplace() {
  const container = document.getElementById("worksplaceContainer");
  if (container.style.display === "none" || container.style.display === "") {
    container.style.display = "block";
    renderWorksplace();
  } else {
    container.style.display = "none";
  }
}

function renderWorksplace() {
  const container = document.getElementById("worksplaceContainer");
  container.innerHTML = "";

  const contentContainer = document.createElement("div");
  contentContainer.style.border = "1px solid #dee2e6";
  contentContainer.style.marginTop = "0.5rem";
  contentContainer.style.backgroundColor = "#fff";
  contentContainer.style.padding = "0.5rem";
  contentContainer.style.maxHeight = "300px";
  contentContainer.style.overflowY = "auto";

  // Uncategorized Notes division (no header text)
  const uncatDiv = document.createElement("div");
  uncatDiv.style.padding = "0.5rem";
  uncatDiv.style.backgroundColor = "#f9f9f9";
  uncatDiv.style.borderRadius = "5px";
  const uncategorizedNotes = notes.filter(note => !note.category);
  if (uncategorizedNotes.length > 0) {
    const uncatList = document.createElement("div"); // Changed to div for more compact layout
    uncatList.style.display = "flex";
    uncatList.style.flexWrap = "wrap";
    uncatList.style.gap = "0.25rem";
    uncatList.style.padding = "0.25rem";
    
    uncategorizedNotes.forEach(note => {
      const noteItem = document.createElement("span");
      noteItem.textContent = note.title || "No Title";
      noteItem.style.cursor = "pointer";
      noteItem.style.padding = "0.1rem 0.5rem";
      noteItem.style.margin = "0.1rem";
      noteItem.style.fontSize = "0.85rem";
      noteItem.style.backgroundColor = "#e9ecef";
      noteItem.style.borderRadius = "3px";
      noteItem.style.border = "1px solid #dee2e6";
      noteItem.style.display = "inline-block";
      noteItem.style.maxWidth = "100%";
      noteItem.style.overflow = "hidden";
      noteItem.style.textOverflow = "ellipsis";
      noteItem.style.whiteSpace = "nowrap";
      // Add a file icon to indicate this is a note
      noteItem.innerHTML = `<i class="fa-solid fa-file-lines"></i> ${note.title || "No Title"}`;
      noteItem.onclick = () => { openNote(notes.indexOf(note)); };
      uncatList.appendChild(noteItem);
    });
    uncatDiv.appendChild(uncatList);
  } else {
    const emptyMsg = document.createElement("div");
    emptyMsg.textContent = "No uncategorized notes.";
    emptyMsg.style.fontStyle = "italic";
    emptyMsg.style.margin = "0.5rem 0";
    uncatDiv.appendChild(emptyMsg);
  }
  contentContainer.appendChild(uncatDiv);

  // Dashed divider
  const divider = document.createElement("hr");
  divider.style.border = "none";
  divider.style.borderTop = "1px dashed #ccc";
  divider.style.margin = "0.5rem 0";
  contentContainer.appendChild(divider);

  // Categorized Notes division (no header text)
  const catDiv = document.createElement("div");
  catDiv.style.padding = "0.5rem";
  catDiv.style.backgroundColor = "#fefefe";
  catDiv.style.borderRadius = "5px";
  const uniqueCats = [...new Set(notes.map(n => n.category).filter(c => c))];
  uniqueCats.forEach(cat => {
    const catContainer = document.createElement("div");
    catContainer.style.marginBottom = "0.5rem";

    // A clickable bar for category with a folder icon
    const toggleBar = document.createElement("div");
    toggleBar.style.padding = "0.3rem 0";
    toggleBar.style.cursor = "pointer";
    toggleBar.style.borderBottom = "1px solid #eee";
    // Set initial icon to folder-open using FA
    toggleBar.innerHTML = `<i class="fa-solid fa-folder"></i> <span style="font-weight: bold;">${cat}</span>`;
    toggleBar.onclick = () => {
      const list = catContainer.querySelector("ul");
      list.style.display = (list.style.display === "none" || !list.style.display) ? "block" : "none";
      const icon = list.style.display === "block" 
                   ? `<i class="fa-solid fa-folder-open"></i>` 
                   : `<i class="fa-solid fa-folder"></i>`;
      toggleBar.innerHTML = `${icon} <span style="font-weight: bold;">${cat}</span>`;
    };
    catContainer.appendChild(toggleBar);

    const catList = document.createElement("ul");
    catList.style.listStyleType = "none";
    catList.style.paddingLeft = "1rem";
    catList.style.margin = "0.25rem 0";
    const notesInCat = notes.filter(note => note.category === cat);
    notesInCat.forEach(note => {
      const li = document.createElement("li");
      li.innerHTML = `<i class="fa-solid fa-file-lines"></i> ${note.title || "No Title"}`; // Add note icon
      li.style.cursor = "pointer";
      li.style.padding = "0.25rem 0";
      li.style.fontSize = "0.85rem"; 
      li.onclick = () => { openNote(notes.indexOf(note)); };
      catList.appendChild(li);
    });
    // Hide list by default
    catList.style.display = "none";
    catContainer.appendChild(catList);
    catDiv.appendChild(catContainer);
  });
  contentContainer.appendChild(catDiv);
  container.appendChild(contentContainer);
}

function togglePins() {
  const container = document.getElementById("pinsContainer");
  if (container.style.display === "none" || container.style.display === "") {
    container.style.display = "block";
    renderPins();
  } else {
    container.style.display = "none";
  }
}

function renderPins() {
  const container = document.getElementById("pinsContainer");
  container.innerHTML = "";

  const contentContainer = document.createElement("div");
  contentContainer.style.border = "1px solid #dee2e6";
  contentContainer.style.marginTop = "0.5rem";
  contentContainer.style.backgroundColor = "#fff";
  contentContainer.style.padding = "0.5rem";
  contentContainer.style.maxHeight = "300px";
  contentContainer.style.overflowY = "auto";

  // Add a single title for all pinned items
  const pinnedItemsTitle = document.createElement("div");
  pinnedItemsTitle.innerHTML = `<i class="fa-solid fa-thumbtack"></i> <span style='font-weight: bold;'>Pinned Items</span>`;
  pinnedItemsTitle.style.marginBottom = "0.75rem";
  pinnedItemsTitle.style.borderBottom = "1px solid #eee";
  pinnedItemsTitle.style.paddingBottom = "0.25rem";
  contentContainer.appendChild(pinnedItemsTitle);

  const pinnedNotes = notes.filter(note => note.favorite);
  const pinnedCategories = [];
  notes.forEach(note => {
    if (note.category && note.categoryPinned && !pinnedCategories.includes(note.category)) {
      pinnedCategories.push(note.category);
    }
  });

  // Pinned Notes division (without title)
  if (pinnedNotes.length > 0) {
    const notesDiv = document.createElement("div");
    notesDiv.style.padding = "0.5rem";
    notesDiv.style.backgroundColor = "#fff4e5"; // Light warm color for pins section
    notesDiv.style.borderRadius = "5px";
    notesDiv.style.marginBottom = "0.5rem";
    
    const notesList = document.createElement("div");
    notesList.style.display = "flex";
    notesList.style.flexWrap = "wrap";
    notesList.style.gap = "0.25rem";
    notesList.style.padding = "0.25rem";
    
    pinnedNotes.forEach(note => {
      const noteItem = document.createElement("span");
      noteItem.style.cursor = "pointer";
      noteItem.style.padding = "0.1rem 0.5rem";
      noteItem.style.margin = "0.1rem";
      noteItem.style.fontSize = "0.85rem";
      noteItem.style.backgroundColor = "#ffe8cc";
      noteItem.style.borderRadius = "3px";
      noteItem.style.border = "1px solid #ffcc80";
      noteItem.style.display = "inline-block";
      noteItem.style.maxWidth = "100%";
      noteItem.style.overflow = "hidden";
      noteItem.style.textOverflow = "ellipsis";
      noteItem.style.whiteSpace = "nowrap";
      noteItem.innerHTML = `<i class="fa-solid fa-file-lines"></i> ${note.title || "No Title"}`;
      noteItem.onclick = () => { openNote(notes.indexOf(note)); };
      notesList.appendChild(noteItem);
    });
    
    notesDiv.appendChild(notesList);
    contentContainer.appendChild(notesDiv);
  }

  // Pinned Categories division (without title)
  if (pinnedCategories.length > 0) {
    const catDiv = document.createElement("div");
    catDiv.style.padding = "0.5rem";
    catDiv.style.borderRadius = "5px";
    
    pinnedCategories.forEach(category => {
      const catContainer = document.createElement("div");
      catContainer.style.marginBottom = "0.5rem";
      
      // A clickable bar for category with a folder icon
      const toggleBar = document.createElement("div");
      toggleBar.style.padding = "0.3rem 0";
      toggleBar.style.cursor = "pointer";
      toggleBar.style.borderBottom = "1px solid #eee";
      // Initially show the collapsed icon (folder)
      toggleBar.innerHTML = `<i class="fa-solid fa-folder"></i> <span style="font-weight: bold;">${category}</span>`;
      toggleBar.onclick = () => {
        const list = catContainer.querySelector("ul");
        list.style.display = (list.style.display === "none" || !list.style.display) ? "block" : "none";
        const icon = list.style.display === "block" 
                     ? `<i class="fa-solid fa-folder-open"></i>` 
                     : `<i class="fa-solid fa-folder"></i>`;
        toggleBar.innerHTML = `${icon} <span style="font-weight: bold;">${category}</span>`;
      };
      catContainer.appendChild(toggleBar);
      
      const catList = document.createElement("ul");
      catList.style.listStyleType = "none";
      catList.style.paddingLeft = "1rem";
      catList.style.margin = "0.25rem 0";
      const notesInCat = notes.filter(note => note.category === category);
      notesInCat.forEach(note => {
        const li = document.createElement("li");
        li.innerHTML = `<i class="fa-solid fa-file-lines"></i> ${note.title || "No Title"}`; // Add note icon
        li.style.cursor = "pointer";
        li.style.padding = "0.25rem 0";
        li.style.fontSize = "0.85rem"; 
        li.onclick = () => { openNote(notes.indexOf(note)); };
        catList.appendChild(li);
      });
      // Hide list by default
      catList.style.display = "none";
      catContainer.appendChild(catList);
      catDiv.appendChild(catContainer);
    });
    
    contentContainer.appendChild(catDiv);
  }

  if (pinnedNotes.length === 0 && pinnedCategories.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.textContent = "No pinned items.";
    emptyMsg.style.fontStyle = "italic";
    emptyMsg.style.padding = "0.5rem";
    contentContainer.appendChild(emptyMsg);
  }
  
  container.appendChild(contentContainer);
}

function confirmSave() {
  const modalEl = document.getElementById("saveModal");
  const modalInstance =
      bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modalInstance.hide();

  if (currentTab === "unsaved") {
      unsavedNote.title = document.getElementById("noteTitle").value;
      unsavedNote.content = document.getElementById("noteContent").innerHTML;
      unsavedNote.category = selectedCategory;
      notes.push(unsavedNote);
      let newIndex = notes.length - 1;
      currentTab = newIndex;
      if (!openTabs.includes(newIndex)) {
          openTabs.push(newIndex);
      }
      unsavedNote = null;
  } else if (currentTab !== null) {
      notes[currentTab].title = document.getElementById("noteTitle").value;
      notes[currentTab].content = document.getElementById("noteContent").innerHTML;
      notes[currentTab].category = selectedCategory;
  }
  localStorage.setItem("notes", JSON.stringify(notes));
  updateTabs();
  // Update worksplace if it's visible
  const worksplaceContainer = document.getElementById("worksplaceContainer");
  if (worksplaceContainer.style.display !== "none") {
      renderWorksplace();
  }
  showMainMenu();
}

updateTabs();
renderMainCards();
showMainMenu();