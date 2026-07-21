/*==================== LOAD ACTIVE BORROWS ====================*/
fetch("/library/api/active-borrows/")
  .then(res => res.json())
  .then(data => {
    const recordSelect = document.getElementById("returnRecordSelect");
    if (data.records.length === 0) {
      recordSelect.innerHTML = `<option value="">No books currently borrowed</option>`;
    } else {
      recordSelect.innerHTML = data.records.map(r => `<option value="${r.id}">${r.label}</option>`).join("");
    }
  })
  .catch(error => console.error("Error loading active borrows:", error));

/*==================== SUBMIT ====================*/
document.getElementById("submitReturnBook").addEventListener("click", () => {
  const record_id = document.getElementById("returnRecordSelect").value;
  const msg = document.getElementById("returnMsg");

  if (!record_id) {
    alert("No borrow record selected.");
    return;
  }

  fetch("/library/api/return-book/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ record_id })
  })
    .then(res => res.json())
    .then(data => {
      msg.innerText = "Book returned successfully!";
      setTimeout(() => location.reload(), 900);
    })
    .catch(error => console.error("Error returning book:", error));
});
