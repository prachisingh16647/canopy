/*==================== LOAD BOOKS + MEMBERS ====================*/
fetch("http://127.0.0.1:8000/library/api/books-members/")
  .then(res => res.json())
  .then(data => {
    const bookSelect = document.getElementById("issueBookSelect");
    const memberSelect = document.getElementById("issueMemberSelect");

    if (data.books.length === 0) {
      bookSelect.innerHTML = `<option value="">No available books</option>`;
    } else {
      bookSelect.innerHTML = data.books.map(b => `<option value="${b.id}">${b.title}</option>`).join("");
    }

    memberSelect.innerHTML = data.members.map(m => `<option value="${m.id}">${m.name}</option>`).join("");
  })
  .catch(error => console.error("Error loading books/members:", error));

/*==================== SUBMIT ====================*/
document.getElementById("submitIssueBook").addEventListener("click", () => {
  const book_id = document.getElementById("issueBookSelect").value;
  const member_id = document.getElementById("issueMemberSelect").value;
  const due_date = document.getElementById("issueDueDate").value;
  const msg = document.getElementById("issueMsg");

  if (!book_id) {
    alert("No book available to issue.");
    return;
  }
  if (!due_date) {
    alert("Please select a due date.");
    return;
  }

  fetch("http://127.0.0.1:8000/library/api/issue-book/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_id, member_id, due_date })
  })
    .then(res => res.json())
    .then(data => {
      msg.innerText = "Book issued successfully!";
      setTimeout(() => location.reload(), 900);
    })
    .catch(error => console.error("Error issuing book:", error));
});