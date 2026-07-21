fetch("/library/api/due-books/")
  .then(res => res.json())
  .then(data => {
    const tbody = document.getElementById("dueBooksBody");
    tbody.innerHTML = "";

    if (data.records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">No due or overdue books 🎉</td></tr>`;
      return;
    }

    data.records.forEach(r => {
      const statusClass = r.status === "Overdue" ? "borrowed" : "available";
      const label = r.status === "Overdue" ? `${r.status} by ${r.days} day(s)` : `${r.status} (${r.days} day(s) left)`;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${r.book}</td>
        <td>${r.member}</td>
        <td>${r.due_date}</td>
        <td><span class="${statusClass}">${label}</span></td>
      `;
      tbody.appendChild(row);
    });
  })
  .catch(error => console.error("Error loading due books:", error));
