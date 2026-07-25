let allBooksData = []; // keeps the full book list in memory so Edit can look up by id safely

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

function loadBooks() {
  fetch("/library/api/all-books/")
    .then(res => res.json())
    .then(data => {
      allBooksData = data.books;
      const tbody = document.getElementById("allBooksBody");
      tbody.innerHTML = "";
      data.books.forEach(book => {
        const statusClass = book.status === "Available" ? "available" : "borrowed";
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>
            <div class="book">
              <img src="${escapeHtml(book.cover)}">
              <span>${escapeHtml(book.title)}</span>
            </div>
          </td>
          <td>${escapeHtml(book.author)}</td>
          <td><span class="${statusClass}">${escapeHtml(book.status)}</span></td>
          <td><button class="edit" data-id="${book.id}">Edit</button></td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(error => console.error("Error loading books:", error));
}

loadBooks();

/*==================== SEARCH ====================*/
const search = document.getElementById("bookSearch");
search.addEventListener("keyup", () => {
  const value = search.value.toLowerCase();
  const rows = document.querySelectorAll("#allBooksBody tr");
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(value) ? "" : "none";
  });
});

/*==================== ADD / EDIT BOOK MODAL ====================*/
const addBookModal = document.getElementById("addBookModal");
const openAddBookBtn = document.getElementById("openAddBookBtn");
const bookModalTitle = document.getElementById("bookModalTitle");
const submitBookBtn = document.getElementById("submitAddBook");
const titleInput = document.getElementById("newBookTitle");
const authorInput = document.getElementById("newBookAuthor");
const coverInput = document.getElementById("newBookCover");

let editingBookId = null; // null = adding a new book, otherwise the id being edited

function openModalForAdd() {
  editingBookId = null;
  bookModalTitle.textContent = "Add New Book";
  submitBookBtn.textContent = "Add Book";
  titleInput.value = "";
  authorInput.value = "";
  coverInput.value = "";
  addBookModal.classList.add("active");
}

function openModalForEdit(id) {
  const book = allBooksData.find(b => String(b.id) === String(id));
  if (!book) {
    alert("Could not find that book's details. Try refreshing the page.");
    return;
  }
  editingBookId = id;
  bookModalTitle.textContent = "Edit Book";
  submitBookBtn.textContent = "Save Changes";
  titleInput.value = book.title;
  authorInput.value = book.author;
  coverInput.value = book.cover_url || "";
  addBookModal.classList.add("active");
}

openAddBookBtn.addEventListener("click", openModalForAdd);

document.getElementById("allBooksBody").addEventListener("click", (e) => {
  if (!e.target.classList.contains("edit")) return;
  openModalForEdit(e.target.dataset.id);
});

document.getElementById("cancelAddBook").addEventListener("click", () => {
  addBookModal.classList.remove("active");
});

submitBookBtn.addEventListener("click", () => {
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const cover = coverInput.value.trim();

  if (!title || !author) {
    alert("Please fill in title and author.");
    return;
  }

  if (editingBookId) {
    fetch(`/library/api/edit-book/${editingBookId}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author, cover })
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }
        addBookModal.classList.remove("active");
        loadBooks();
      })
      .catch(error => console.error("Error editing book:", error));
  } else {
    fetch("/library/api/add-book/", {
      method: "POST",
      headers: {
