function loadDueBooks() {

    fetch("/library/api/due-books/")
        .then(response => {

            if (!response.ok) {
                throw new Error("Failed to load due books");
            }

            return response.json();
        })

        .then(data => {

            const tbody =
                document.getElementById("dueBooksBody");

            if (!tbody) {
                console.error("dueBooksBody element not found");
                return;
            }

            tbody.innerHTML = "";

            const records = data.records || [];

            if (records.length === 0) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center;">
                            No due or overdue books 🎉
                        </td>
                    </tr>
                `;

                return;
            }


            records.forEach(r => {

                const statusClass =
                    r.status === "Overdue"
                        ? "borrowed"
                        : "available";


                const label =
                    r.status === "Overdue"
                        ? `${r.status} by ${r.days} day(s)`
                        : `${r.status} (${r.days} day(s) left)`;


                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        ${r.book}
                    </td>

                    <td>
                        ${r.member}
                    </td>

                    <td>
                        ${r.due_date}
                    </td>

                    <td>
                        <span class="${statusClass}">
                            ${label}
                        </span>
                    </td>

                    <td>
                        <button
                            class="edit"
                            data-id="${r.id}">
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
   INITIAL LOAD
========================================================= */

loadDueBooks();


/* =========================================================
   EDIT BUTTONS
========================================================= */

const dueBooksBody =
    document.getElementById("dueBooksBody");


if (dueBooksBody) {

    dueBooksBody.addEventListener("click", event => {

        if (!event.target.classList.contains("edit")) {
            return;
        }


        const recordId =
            event.target.dataset.id;


        const row =
            event.target.closest("tr");


        const bookName =
            row.cells[0].textContent.trim();


        const currentDate =
            row.cells[2].textContent.trim();


        editDueDate(
            recordId,
            bookName,
            currentDate
        );

    });

}


/* =========================================================
   EDIT DUE DATE
========================================================= */

function editDueDate(
    recordId,
    bookName,
    currentDate
) {

    const newDate = prompt(
        `Enter the new due date for "${bookName}"\n\nFormat: YYYY-MM-DD`,
        ""
    );


    if (newDate === null) {
        return;
    }


    const trimmedDate =
        newDate.trim();


    if (!trimmedDate) {

        alert("Please enter a due date.");

        return;
    }


    const datePattern =
        /^\d{4}-\d{2}-\d{2}$/;


    if (!datePattern.test(trimmedDate)) {

        alert(
            "Please enter the date in YYYY-MM-DD format.\n\nExample: 2026-09-15"
        );

        return;
    }


    const selectedDate =
        new Date(trimmedDate + "T00:00:00");


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


    fetch(
        `/library/api/edit-due-date/${recordId}/`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                due_date: trimmedDate
            })
        }
    )

        .then(response => response.json())

        .then(data => {

            if (data.error) {

                alert(data.error);

                return;
            }


            if (!data.success) {

                alert(
                    "Unable to update the due date."
                );

                return;
            }


            alert(
                `Due date updated successfully!\n\nNew due date: ${data.due_date}`
            );


            loadDueBooks();

        })

        .catch(error => {

            console.error(
                "Error editing due date:",
                error
            );


            alert(
                "Something went wrong while editing the due date."
            );

        });

}
