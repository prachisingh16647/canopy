fetch("/library/api/reports/")
  .then(res => res.json())
  .then(data => {

    document.getElementById("rTotalBooks").innerText =
      data.total_books;

    document.getElementById("rTotalMembers").innerText =
      data.total_members;

    document.getElementById("rBorrowed").innerText =
      data.active_borrowed;

    document.getElementById("rOverdue").innerText =
      data.overdue_books;

    document.getElementById("rReturned").innerText =
      data.returned_books;

  })
  .catch(error => {
    console.error("Error loading reports:", error);
  });
