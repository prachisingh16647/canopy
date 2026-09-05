function loadDueBooks() {

  fetch("/library/api/due-books/")
    .then(res => {

      if (!res.ok) {
        throw new Error("Failed to load due books");
      }

      return res.json();

    })
    .then(data => {

      const tbody = document.getElementById("dueBooksBody");

      tbody.innerHTML = "";

      if (data.records.length === 0) {

        tbody.innerHTML = `
          <tr>
            <td colspan="5">
              No due or overdue books 🎉
            </td>
          </tr>
        `;

        return;
      }


      data.records.forEach(r => {

        const statusClass =
          r.status === "Overdue"
            ? "borrowed"
            : "available";


        const label =
          r.status === "Overdue"
            ? `${r.status} by ${r.days} day(s)`
            : `${r.status} (${r.days} day(s) left)`;


        const row = document.createElement("tr");


        row.innerHTML = `
          <td>${r.book}</td>

          <td>${r.member}</td>

          <td>${r.due_date}</td>

          <td>
            <span class="${statusClass}">
              ${label}
            </span>
          </td>

          <td>
            <button
              class="edit-due-btn"
              onclick="editDueDate(${r.id}, '${r.book.replace(/'/g, "\\'")}', '${r.due_date}')"
            >
              <i class="fa-solid fa-pen"></i>
              Edit
            </button>
          </td>
        `;


        tbody.appendChild(row);

      });

    })
    .catch(error => {

      console.error(
        "Error loading due books:",
        error
      );

    });

}



/* =========================================================
   EDIT DUE DATE
========================================================= */

function editDueDate(recordId, bookName, currentDate) {

  const newDate = prompt(
    `Enter the new due date for "${bookName}"\n\nFormat: YYYY-MM-DD`,
    ""
  );


  // User clicked Cancel
  if (newDate === null) {
    return;
  }


  const trimmedDate = newDate.trim();


  if (!trimmedDate) {

    alert("Please enter a due date.");

    return;

  }


  // Check date format
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;


  if (!datePattern.test(trimmedDate)) {

    alert(
      "Please enter the date in YYYY-MM-DD format.\n\nExample: 2026-09-15"
    );

    return;

  }


  // Check that the date is actually valid
  const selectedDate = new Date(trimmedDate + "T00:00:00");


  if (isNaN(selectedDate.getTime())) {

    alert("Please enter a valid date.");

    return;

  }


  if (
    !confirm(
      `Change the due date for "${bookName}" to ${trimmedDate}?`
    )
  ) {

    return;

  }


  fetch(`/library/api/edit-due-date/${recordId}/`, {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      due_date: trimmedDate
    })

  })

    .then(res => res.json())

    .then(data => {

      if (!data.success) {

        throw new Error(
          data.error || "Unable to update due date."
        );

      }


      alert(
        `Due date updated successfully!\n\nNew due date: ${data.due_date}`
      );


      // Reload the table so status/days are recalculated
      loadDueBooks();

    })

    .catch(error => {

      console.error(
        "Edit due date error:",
        error
      );


      alert(
        "Something went wrong while updating the due date."
      );

    });

}



/* =========================================================
   INITIAL LOAD
========================================================= */

loadDueBooks();
