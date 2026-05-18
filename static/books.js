fetch("http://127.0.0.1:8000/library/api/all-books/")
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
        <td><button class="edit">Edit</button></td>
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

/*==================== ADD BOOK MODAL ====================*/
const addBookModal = document.getElementById("addBookModal");
const openAddBookBtn = document.getElementById("openAddBookBtn");

openAddBookBtn.addEventListener("click", () => {
  addBookModal.classList.add("active");
});

document.getElementById("cancelAddBook").addEventListener("click", () => {
  addBookModal.classList.remove("active");
});

document.getElementById("submitAddBook").addEventListener("click", () => {
  const title = document.getElementById("newBookTitle").value;
  const author = document.getElementById("newBookAuthor").value;
  const cover = document.getElementById("newBookCover").value;

  if (!title || !author) {
    alert("Please fill in title and author.");
    return;
  }

  fetch("http://127.0.0.1:8000/library/api/add-book/", {
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
});