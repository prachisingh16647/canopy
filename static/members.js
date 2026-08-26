function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

fetch("/library/api/all-members/")
  .then(res => res.json())
  .then(data => {
    const tbody = document.getElementById("allMembersBody");
    tbody.innerHTML = "";
    data.members.forEach(member => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(member.name)}</td>
        <td>${escapeHtml(member.email)}</td>
        <td>${escapeHtml(member.phone)}</td>
        <td>${escapeHtml(member.joined)}</td>
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

const EMAIL_RE = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_RE = /^\d{10}$/;
const USERNAME_RE = /^[a-zA-Z0-9_.]{4,30}$/;

document.getElementById("submitAddMember").addEventListener("click", () => {
  const name = document.getElementById("newMemberName").value.trim();
  const email = document.getElementById("newMemberEmail").value.trim();
  const phone = document.getElementById("newMemberPhone").value.trim();
  const username = document.getElementById("newMemberUsername").value.trim();
  const password = document.getElementById("newMemberPassword").value;

  if (!name || name.length < 2) {
    alert("Please enter a valid name.");
    return;
  }
  if (!EMAIL_RE.test(email)) {
    alert("Please enter a valid email address.");
    return;
  }
  if (phone && !PHONE_RE.test(phone)) {
    alert("Phone number must be exactly 10 digits.");
    return;
  }
  if (username || password) {
    if (!USERNAME_RE.test(username)) {
      alert("Username must be 4-30 characters (letters, numbers, '.', '_' only).");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      alert("Password must be at least 8 characters and include a letter and a number.");
      return;
    }
  }

  fetch("/library/api/add-member/", {
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
