fetch("/library/api/reports/")
  .then(response => {
    if (!response.ok) {
      throw new Error("Failed to load reports.");
    }

    return response.json();
  })
  .then(data => {

    console.log("REPORT DATA:", data);

    document.getElementById("rTotalBooks").textContent =
      data.total_books;

    document.getElementById("rTotalMembers").textContent =
      data.total_members;

    document.getElementById("rBorrowed").textContent =
      data.active_borrowed;

    document.getElementById("rOverdue").textContent =
      data.overdue_books;

    document.getElementById("rReturned").textContent =
      data.returned_books;

  })
  .catch(error => {
    console.error("Error loading reports:", error);
  });
