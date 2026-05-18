/*==================== DARK MODE ====================*/

const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    if(document.body.classList.contains("dark")){
        themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
    else{
        themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }

});

/*==================== FETCH REAL DATA ====================*/

fetch("http://127.0.0.1:8000/library/api/dashboard/")
  .then(response => response.json())
  .then(data => {
    document.getElementById("totalBooks").setAttribute("data-target", data.total_books);
    document.getElementById("totalMembers").setAttribute("data-target", data.total_member);
    document.getElementById("totalBorrowed").setAttribute("data-target", data.borrowed);
    document.getElementById("totalOverdue").setAttribute("data-target", data.overdue);

    const tbody = document.getElementById("recentBooksBody");
    tbody.innerHTML = "";

    data.recent_books.forEach(book => {
      const statusClass = book.status === "Available" ? "available" : "borrowed";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <div class="book">
            <img src="${book.cover}">
            <span>${book.title}</span>
          </div>
        </td>
        <td>${book.author}</td>
        <td><span class="${statusClass}">${book.status}</span></td>
        <td><button class="edit">Edit</button></td>
      `;
      tbody.appendChild(row);
    });

    // Re-run counter animation now that data-target values are set
    startCounters();

    // Render the borrow statistics chart using real monthly counts
    renderBorrowChart(data.monthly_labels, data.monthly_counts);

    // Render recent activity feed using real events
    renderRecentActivity(data.recent_activity);

    // Update notification bell badge with real overdue count
    const notifBadge = document.getElementById("notifBadge");
    if (notifBadge) notifBadge.innerText = data.overdue;
  })
  .catch(error => console.error("Error fetching dashboard data:", error));


/*==================== COUNTER ====================*/
function startCounters(){

const counters = document.querySelectorAll(".counter");

counters.forEach(counter=>{

    counter.innerText="0";

    const updateCounter=()=>{

        const target=+counter.getAttribute("data-target");

        const count=+counter.innerText;

        const increment=target/120;

        if(count<target){

            counter.innerText=Math.ceil(count+increment);

            setTimeout(updateCounter,15);

        }

        else{

            counter.innerText=target.toLocaleString();

        }

    }

    updateCounter();

});

}
/*==================== SEARCH ====================*/

const search=document.querySelector(".search-box input");

search.addEventListener("keyup",()=>{

    const value=search.value.toLowerCase();

    const rows=document.querySelectorAll("tbody tr");

    rows.forEach(row=>{

        const text=row.innerText.toLowerCase();

        row.style.display=text.includes(value) ? "" : "none";

    });

});


/*==================== CHART ====================*/

function renderBorrowChart(labels, counts){

const ctx = document.getElementById("borrowChart");

if(!ctx) return;

new Chart(ctx,{

type:"line",

data:{

labels: labels || [],

datasets:[{

label:"Borrowed Books",

data: counts || [],

fill:true,

borderColor:"#2d6a4f",

backgroundColor:"rgba(45,106,79,.15)",

borderWidth:4,

tension:.4,

pointRadius:5,

pointBackgroundColor:"#2d6a4f"

}]

},

options:{

responsive:true,
maintainAspectRatio:false,

plugins:{

legend:{
display:false
}

},

scales:{

y:{

beginAtZero:true,

grid:{
color:"#e5e7eb"
}

},

x:{

grid:{
display:false
}

}

}

}

});

}

/*==================== RECENT ACTIVITY ====================*/

function renderRecentActivity(activities){

const list = document.getElementById("recentActivityList");

if(!list) return;

list.innerHTML = "";

if(!activities || activities.length === 0){

list.innerHTML = `<li>No recent activity yet</li>`;

return;

}

activities.forEach(text => {

const li = document.createElement("li");

li.innerHTML = `<i class="fa-solid fa-circle"></i> ${text}`;

list.appendChild(li);

});

}


/*==================== CARD ANIMATION ====================*/

const cards=document.querySelectorAll(".card");

cards.forEach(card=>{

card.addEventListener("mouseenter",()=>{

card.style.transform="translateY(-10px) scale(1.02)";

});

card.addEventListener("mouseleave",()=>{

card.style.transform="translateY(0) scale(1)";

});

});


/*==================== ACTIVE MENU ====================*/

const menu=document.querySelectorAll(".menu li");

menu.forEach(item=>{

item.addEventListener("click",()=>{

menu.forEach(i=>i.classList.remove("active"));

item.classList.add("active");

});

});

/*==================== ADD BOOK MODAL ====================*/

const addBookModal = document.getElementById("addBookModal");
const quickActionButtons = document.querySelectorAll(".quick-actions button");

quickActionButtons[0].addEventListener("click", () => {
  addBookModal.classList.add("active");
});

document.getElementById("cancelAddBook").addEventListener("click", () => {
  addBookModal.classList.remove("active");
});

document.getElementById("submitAddBook").addEventListener("click", () => {
  const title = document.getElementById("newBookTitle").value;
  const author = document.getElementById("newBookAuthor").value;
  const cover = document.getElementById("newBookCover").value;

  if (!title || !author) {
    alert("Please fill in title and author.");
    return;
  }

  fetch("http://127.0.0.1:8000/library/api/add-book/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, author, cover })
  })
    .then(response => response.json())
    .then(data => {
      alert("Book added successfully!");
      addBookModal.classList.remove("active");
      location.reload();
    })
    .catch(error => console.error("Error adding book:", error));
});

/*==================== ISSUE BOOK MODAL ====================*/

const issueBookModal = document.getElementById("issueBookModal");

quickActionButtons[1].addEventListener("click", () => {
  fetch("http://127.0.0.1:8000/library/api/books-members/")
    .then(res => res.json())
    .then(data => {
      const bookSelect = document.getElementById("issueBookSelect");
      const memberSelect = document.getElementById("issueMemberSelect");

      bookSelect.innerHTML = data.books.map(b => `<option value="${b.id}">${b.title}</option>`).join("");
      memberSelect.innerHTML = data.members.map(m => `<option value="${m.id}">${m.name}</option>`).join("");

      issueBookModal.classList.add("active");
    });
});

document.getElementById("cancelIssueBook").addEventListener("click", () => {
  issueBookModal.classList.remove("active");
});

document.getElementById("submitIssueBook").addEventListener("click", () => {
  const book_id = document.getElementById("issueBookSelect").value;
  const member_id = document.getElementById("issueMemberSelect").value;
  const due_date = document.getElementById("issueDueDate").value;

  if (!due_date) {
    alert("Please select a due date.");
    return;
  }

  fetch("http://127.0.0.1:8000/library/api/issue-book/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_id, member_id, due_date })
  })
    .then(res => res.json())
    .then(data => {
      alert("Book issued successfully!");
      issueBookModal.classList.remove("active");
      location.reload();
    })
    .catch(error => console.error("Error issuing book:", error));
});
/*==================== RETURN BOOK MODAL ====================*/

const returnBookModal = document.getElementById("returnBookModal");

quickActionButtons[2].addEventListener("click", () => {
  fetch("http://127.0.0.1:8000/library/api/active-borrows/")
    .then(res => res.json())
    .then(data => {
      const recordSelect = document.getElementById("returnRecordSelect");
      recordSelect.innerHTML = data.records.map(r => `<option value="${r.id}">${r.label}</option>`).join("");
      returnBookModal.classList.add("active");
    });
});

document.getElementById("cancelReturnBook").addEventListener("click", () => {
  returnBookModal.classList.remove("active");
});

document.getElementById("submitReturnBook").addEventListener("click", () => {
  const record_id = document.getElementById("returnRecordSelect").value;

  fetch("http://127.0.0.1:8000/library/api/return-book/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ record_id })
  })
    .then(res => res.json())
    .then(data => {
      alert("Book returned successfully!");
      returnBookModal.classList.remove("active");
      location.reload();
    })
    .catch(error => console.error("Error returning book:", error));
});

/*==================== ADD MEMBER MODAL ====================*/

const addMemberModal = document.getElementById("addMemberModal");

quickActionButtons[3].addEventListener("click", () => {
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
/*==================== NOTIFICATION BELL ====================*/

const notificationBell = document.getElementById("notificationBell");
const notificationDropdown = document.getElementById("notificationDropdown");
const notificationList = document.getElementById("notificationList");

if (notificationBell && notificationDropdown) {

  notificationBell.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpening = !notificationDropdown.classList.contains("active");
    notificationDropdown.classList.toggle("active");

    if (isOpening) {
      notificationList.innerHTML = `<li class="notif-empty">Loading...</li>`;

      fetch("http://127.0.0.1:8000/library/api/due-books/")
        .then(res => res.json())
        .then(data => {
          const overdueOnly = data.records.filter(r => r.status === "Overdue");

          if (overdueOnly.length === 0) {
            notificationList.innerHTML = `<li class="notif-empty">No overdue books 🎉</li>`;
            return;
          }

          notificationList.innerHTML = overdueOnly.map(r => `
            <li>
              <span class="notif-title">${r.book}</span>
              <span class="notif-member">${r.member}</span>
              <span class="notif-meta">Overdue by ${r.days} day(s) — due ${r.due_date}</span>
            </li>
          `).join("");
        })
        .catch(error => {
          console.error("Error loading notifications:", error);
          notificationList.innerHTML = `<li class="notif-empty">Couldn't load notifications</li>`;
        });
    }
  });

  // Close the dropdown when clicking anywhere else on the page
  document.addEventListener("click", (e) => {
    if (!notificationBell.contains(e.target)) {
      notificationDropdown.classList.remove("active");
    }
  });
}
