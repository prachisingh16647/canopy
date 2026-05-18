fetch("http://127.0.0.1:8000/library/api/all-members/")
  .then(res => res.json())
  .then(data => {
    const tbody = document.getElementById("allMembersBody");
    tbody.innerHTML = "";
    data.members.forEach(member => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${member.name}</td>
        <td>${member.email}</td>
        <td>${member.phone}</td>
        <td>${member.joined}</td>
      `;
      tbody.appendChild(row);
    });
  })
  .catch(error => console.error("Error loading members:", error));

/*==================== SEARCH ====================*/
const search = document.getElementById("memberSearch");
search.addEventListener("keyup", () => {
  const value = search.value.toLowerCase();
  const rows = document.querySelectorAll("#allMembersBody tr");
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(value) ? "" : "none";
  });
});

/*==================== ADD MEMBER MODAL ====================*/
const addMemberModal = document.getElementById("addMemberModal");
const openAddMemberBtn = document.getElementById("openAddMemberBtn");

openAddMemberBtn.addEventListener("click", () => {
  addMemberModal.classList.add("active");
});

document.getElementById("cancelAddMember").addEventListener("click", () => {
  addMemberModal.classList.remove("active");
});

document.getElementById("submitAddMember").addEventListener("click", () => {
  const name = document.getElementById("newMemberName").value;
  const email = document.getElementById("newMemberEmail").value;
  const phone = document.getElementById("newMemberPhone").value;
  const username = document.getElementById("newMemberUsername").value;
  const password = document.getElementById("newMemberPassword").value;

  if (!name || !email) {
    alert("Please fill in name and email.");
    return;
  }

  fetch("http://127.0.0.1:8000/library/api/add-member/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone, username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      alert("Member added successfully!");
      addMemberModal.classList.remove("active");
      location.reload();
    })
    .catch(error => console.error("Error adding member:", error));
});