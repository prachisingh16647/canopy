fetch("/library/api/reports/")
  .then(response => {
    if (!response.ok) {
      throw new Error("Failed to load reports.");
    }

    return response.json();
  })
  .then(data => {

    document.getElementById("rTotalBooks").textContent =
      data.total_books ?? 0;

    document.getElementById("rTotalMembers").textContent =
      data.total_members ?? 0;

    document.getElementById("rBorrowed").textContent =
      data.active_borrowed ?? 0;

    document.getElementById("rOverdue").textContent =
      data.overdue_books ?? 0;

    document.getElementById("rReturned").textContent =
      data.returned_books ?? 0;

  })
  .catch(error => {
    console.error("Error loading reports:", error);

    document.getElementById("rTotalBooks").textContent = "0";
    document.getElementById("rTotalMembers").textContent = "0";
    document.getElementById("rBorrowed").textContent = "0";
    document.getElementById("rOverdue").textContent = "0";
    document.getElementById("rReturned").textContent = "0";
  });
