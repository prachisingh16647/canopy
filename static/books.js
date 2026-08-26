let allBooksData = [];

/* ==================== ESCAPE HTML ==================== */

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
}


/* ==================== LOAD BOOKS ==================== */

function loadBooks() {
    fetch("/library/api/all-books/")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load books");
            }
            return response.json();
        })
        .then(data => {

            allBooksData = data.books || [];

            const tbody = document.getElementById("allBooksBody");

            if (!tbody) {
                console.error("allBooksBody element not found");
                return;
            }

            tbody.innerHTML = "";

            allBooksData.forEach(book => {

                const statusClass =
                    book.status === "Available"
                        ? "available"
                        : "borrowed";

                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>
                        <div class="book">
                            <img
                                src="${escapeHtml(book.cover)}"
                                alt="Book Cover"
                                onerror="this.src='https://via.placeholder.com/60'"
                            >
                            <span>${escapeHtml(book.title)}</span>
                        </div>
                    </td>

                    <td>${escapeHtml(book.author)}</td>

                    <td>
                        <span class="${statusClass}">
                            ${escapeHtml(book.status)}
                        </span>
                    </td>

                    <td>
                        <button
                            class="edit"
                            data-id="${book.id}">
                            Edit
                        </button>
                    </td>
                `;

                tbody.appendChild(row);
            });

            if (allBooksData.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align:center;">
                            No books found.
                        </td>
                    </tr>
                `;
            }
        })
        .catch(error => {
            console.error("Error loading books:", error);
        });
}


/* ==================== INITIAL LOAD ==================== */

loadBooks();


/* ==================== SEARCH ==================== */

const search = document.getElementById("bookSearch");

if (search) {

    search.addEventListener("keyup", () => {

        const value = search.value.toLowerCase();

        const rows = document.querySelectorAll("#allBooksBody tr");

        rows.forEach(row => {

            const text = row.innerText.toLowerCase();

            row.style.display =
                text.includes(value) ? "" : "none";
        });
    });
}


/* ==================== MODAL ELEMENTS ==================== */

const addBookModal = document.getElementById("addBookModal");
const openAddBookBtn = document.getElementById("openAddBookBtn");
const bookModalTitle = document.getElementById("bookModalTitle");
const submitBookBtn = document.getElementById("submitAddBook");

const titleInput = document.getElementById("newBookTitle");
const authorInput = document.getElementById("newBookAuthor");
const coverInput = document.getElementById("newBookCover");

const cancelAddBookBtn =
    document.getElementById("cancelAddBook");

let editingBookId = null;


/* ==================== OPEN ADD MODAL ==================== */

function openModalForAdd() {

    editingBookId = null;

    bookModalTitle.textContent = "Add New Book";

    submitBookBtn.textContent = "Add Book";

    titleInput.value = "";
    authorInput.value = "";
    coverInput.value = "";

    addBookModal.classList.add("active");
}


/* ==================== OPEN EDIT MODAL ==================== */

function openModalForEdit(id) {

    const book = allBooksData.find(
        b => String(b.id) === String(id)
    );

    if (!book) {

        alert(
            "Could not find that book's details. Try refreshing the page."
        );

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


/* ==================== ADD BUTTON ==================== */

if (openAddBookBtn) {

    openAddBookBtn.addEventListener(
        "click",
        openModalForAdd
    );
}


/* ==================== EDIT BUTTONS ==================== */

const booksBody =
    document.getElementById("allBooksBody");

if (booksBody) {

    booksBody.addEventListener("click", event => {

        if (!event.target.classList.contains("edit")) {
            return;
        }

        const id = event.target.dataset.id;

        openModalForEdit(id);
    });
}


/* ==================== CANCEL ==================== */

if (cancelAddBookBtn) {

    cancelAddBookBtn.addEventListener("click", () => {

        addBookModal.classList.remove("active");

        editingBookId = null;
    });
}


/* ==================== ADD / EDIT BOOK ==================== */

if (submitBookBtn) {

    submitBookBtn.addEventListener("click", () => {

        const title = titleInput.value.trim();
        const author = authorInput.value.trim();
        const cover = coverInput.value.trim();


        if (!title || !author) {

            alert(
                "Please fill in title and author."
            );

            return;
        }


        /* ==================== EDIT ==================== */

        if (editingBookId) {

            fetch(
                `/library/api/edit-book/${editingBookId}/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        title: title,
                        author: author,
                        cover: cover
                    })
                }
            )
                .then(response => response.json())

                .then(data => {

                    if (data.error) {

                        alert(data.error);

                        return;
                    }

                    addBookModal.classList.remove("active");

                    editingBookId = null;

                    loadBooks();
                })

                .catch(error => {

                    console.error(
                        "Error editing book:",
                        error
                    );

                    alert(
                        "Something went wrong while editing the book."
                    );
                });

        }


        /* ==================== ADD ==================== */

        else {

            fetch(
                "/library/api/add-book/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        title: title,
                        author: author,
                        cover: cover
                    })
                }
            )
                .then(response => response.json())

                .then(data => {

                    if (data.error) {

                        alert(data.error);

                        return;
                    }

                    addBookModal.classList.remove("active");

                    titleInput.value = "";
                    authorInput.value = "";
                    coverInput.value = "";

                    loadBooks();
                })

                .catch(error => {

                    console.error(
                        "Error adding book:",
                        error
                    );

                    alert(
                        "Something went wrong while adding the book."
                    );
                });
        }

    });
}


/* ==================== CLOSE MODAL ON OUTSIDE CLICK ==================== */

if (addBookModal) {

    addBookModal.addEventListener("click", event => {

        if (event.target === addBookModal) {

            addBookModal.classList.remove("active");

            editingBookId = null;
        }
    });
}
