const screens = document.querySelectorAll(".screen");
const screenButtons = document.querySelectorAll("[data-screen]");
const tabButtons = document.querySelectorAll("[data-tab]");
const authActions = document.querySelectorAll(".auth-action");
const helpButton = document.querySelector(".help-button");
const helpPanel = document.querySelector("#help-panel");
const helpClose = document.querySelector(".help-close");
const backDashboardButtons = document.querySelectorAll(".back-dashboard");
const publishRequestButton = document.getElementById("publish-request-button");

let activeRole = "client";
let userRequests = [];
let selectedProfessional = null;

function selectedRole() {
  return document.querySelector('input[name="profile-role"]:checked').value;
}

function dashboardForRole() {
  return activeRole === "professional" ? "professional-screen" : "client-screen";
}

function showScreen(screenId) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === screenId);
  });
}

screenButtons.forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.screen));
});

authActions.forEach((button) => {
  button.addEventListener("click", () => {
    activeRole = selectedRole();
    const isRegister = button.dataset.auth === "register";
    const target = isRegister ? `${activeRole}-register-screen` : dashboardForRole();
    showScreen(target);
  });
});

backDashboardButtons.forEach((button) => {
  button.addEventListener("click", () => showScreen(dashboardForRole()));
});

helpButton.addEventListener("click", () => {
  const isOpen = helpPanel.classList.toggle("active");
  helpButton.setAttribute("aria-expanded", String(isOpen));
});

helpClose.addEventListener("click", () => {
  helpPanel.classList.remove("active");
  helpButton.setAttribute("aria-expanded", "false");
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `${button.dataset.tab}-panel`);
    });
  });
});

function renderUserRequests() {
  const container = document.getElementById("my-requests-list");

  if (!container) return;

  if (userRequests.length === 0) {
    container.innerHTML = `
      <p>No has publicado consultas todavía.</p>
    `;
    return;
  }

  container.innerHTML = userRequests
    .map(
      (request, index) => `
      <article class="request-card">
        <h3>${request.title}</h3>

        <p><strong>Categoría:</strong> ${request.category}</p>

        <p>
          <strong>Estado:</strong>
          <span class="request-status ${request.status.toLowerCase()}">
            ${request.status}
          </span>
        </p>

        <p>${request.description}</p>

        ${
          request.status === "Pendiente"
            ? `
              <div class="request-actions">
                <button onclick="editRequest(${index})">
                  Modificar
                </button>

                <button onclick="cancelRequest(${index})">
                  Cancelar
                </button>

                <button onclick="deleteRequest(${index})">
                  Eliminar
                </button>
              </div>
            `
            : ""
        }
      </article>
    `
    )
    .join("");
}

window.deleteRequest = function (index) {
  userRequests.splice(index, 1);
  renderUserRequests();
};

window.cancelRequest = function (index) {
  userRequests[index].status = "Cancelada";
  renderUserRequests();
};

window.editRequest = function (index) {
  const newText = prompt(
    "Modificar consulta:",
    userRequests[index].description
  );

  if (newText) {
    userRequests[index].description = newText;
    renderUserRequests();
  }
};

publishRequestButton?.addEventListener("click", () => {

  const category =
    document.querySelector("#request-panel select")?.value || "";

  const title =
    document.querySelector("#request-panel input")?.value || "";

  const description =
    document.querySelector("#request-panel textarea")?.value || "";

  userRequests.push({
    category,
    title,
    description,
    status: "Pendiente"
  });

  renderUserRequests();

  showScreen("my-requests-screen");
});

document
  .getElementById("new-request-button")
  ?.addEventListener("click", () => {
    showScreen("client-screen");
  });
  
document.querySelectorAll(".expand-professional")
  .forEach((button) => {

    button.addEventListener("click", () => {

      const details =
        button.parentElement.querySelector(
          ".professional-details"
        );

      details.classList.toggle("expanded");

      button.textContent =
        details.classList.contains("expanded")
          ? "−"
          : "+";
    });

  });  

document
  .querySelectorAll(".consult-professional")
  .forEach((button) => {

    button.addEventListener("click", () => {

      const card =
        button.closest(".professional-card");

      selectedProfessional = {
        profession:
          card.dataset.profession,
        experience:
          card.dataset.experience
      };

      document.getElementById(
        "selected-professional-summary"
      ).innerHTML = `
        <p>
          <strong>Profesión:</strong>
          ${selectedProfessional.profession}
        </p>

        <p>
          <strong>Experiencia:</strong>
          ${selectedProfessional.experience}
        </p>
      `;

      showScreen(
        "professional-request-screen"
      );
    });

  });  
  
document
  .getElementById("back-to-search")
  ?.addEventListener("click", () => {

    showScreen("client-screen");

    document
      .querySelector('[data-tab="search"]')
      ?.click();

  });  