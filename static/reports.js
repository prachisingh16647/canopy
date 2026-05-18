fetch("http://127.0.0.1:8000/library/api/reports/")
  .then(res => res.json())
  .then(data => {
    document.getElementById("rTotalBooks").innerText = data.total_books;
    document.getElementById("rTotalMembers").innerText = data.total_members;
    document.getElementById("rBorrowed").innerText = data.total_borrowed;
    document.getElementById("rOverdue").innerText = data.overdue;
    document.getElementById("rReturned").innerText = data.total_returned;
  })
  .catch(error => console.error("Error loading reports:", error));