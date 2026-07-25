fetch("/library/api/all-books/")
  .then(res => res.json())
  .then(data => {
    const tbody = document.getElementById("allBooksBody");
    tbody.innerHTML = "";
    data.books.forEach(book => {
      const statusClass = book.status === "Available" ? "available" : "borrowed";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <div class="book">
            <img src="${book.cover}">
            <span>${book.title}</span>
          </div>
        </td>
        <td>${book.author}</td>
        <td><span class="${statusClass}">${book.status}</span></td>
        <td><button class="edit" data-id="${book.id}" data-title="${book.title}" data-author="${book.author}" data-cover="${book.cover_url || ''}">Edit</button></td>
      `;
      tbody.appendChild(row);
    });
  })
  .catch(error => console.error("Error loading books:", error));

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

function openModalForEdit(id, title, author, cover) {
  editingBookId = id;
  bookModalTitle.textContent = "Edit Book";
  submitBookBtn.textContent = "Save Changes";
  titleInput.value = title;
  authorInput.value = author;
  coverInput.value = cover;
  addBookModal.classList.add("active");
}

openAddBookBtn.addEventListener("click", openModalForAdd);

document.getElementById("allBooksBody").addEventListener("click", (e) => {
  if (!e.target.classList.contains("edit")) return;
  const btn = e.target;
  openModalForEdit(btn.dataset.id, btn.dataset.title, btn.dataset.author, btn.dataset.cover);
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
        location.reload();
      })
      .catch(error => console.error("Error editing book:", error));
  } else {
    fetch("/library/api/add-book/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author, cover })
    })
      .then(response => response.json())
      .then(data => {
        alert("Book added successfully!");
        addBookModal.classList.remove("active");
        location.reload();
      })
      .catch(error => console.error("Error adding book:", error));
  }
});
