const screens = document.querySelectorAll(".screen");
const screenButtons = document.querySelectorAll("[data-screen]");
const tabButtons = document.querySelectorAll("[data-tab]");
const authActions = document.querySelectorAll(".auth-action");
const helpButton = document.querySelector(".help-button");
const helpPanel = document.querySelector("#help-panel");
const helpClose = document.querySelector(".help-close");
const backDashboardButtons = document.querySelectorAll(".back-dashboard");
const publishRequestButton = document.getElementById("publish-request-button");
const saveDemoButtons = document.querySelectorAll(".save-demo-button");
const importDemoButtons = document.querySelectorAll(".import-demo-button");
const changePasswordButton = document.getElementById("change-password-button");
const saveProfessionalRateButton = document.getElementById("save-professional-rate");

let activeRole = "client";
let userRequests = [];
let selectedProfessional = null;

function selectedRole() {
  return document.querySelector('input[name="profile-role"]:checked').value;
}

function dashboardForRole() {
  return activeRole === "professional" ? "professional-screen" : "client-screen";
}

function syncRoleSpecificUI() {
  const isProfessional = activeRole === "professional";

  document.querySelectorAll(".professional-personal-fields").forEach((section) => {
    section.classList.toggle("hidden", !isProfessional);
  });

  document.querySelectorAll(".professional-only").forEach((element) => {
    element.classList.toggle("hidden", !isProfessional);
  });

  const personalForm = document.getElementById("personal-data-form");
  if (!personalForm) return;

  const usernameInput = document.getElementById("personal-username");
  const nameInput = document.getElementById("personal-full-name");
  const emailInput = document.getElementById("personal-email");

  if (isProfessional) {
    usernameInput.value = "OrientapProfesional1";
    nameInput.value = "Laura Usuario01";
    emailInput.value = "laura.profesional@example.com";
  } else {
    usernameInput.value = "Orientap1";
    nameInput.value = "Andrea Usuario01";
    emailInput.value = "andrea.usuario@example.com";
  }
}

function showScreen(screenId) {
  syncRoleSpecificUI();

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

saveDemoButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const form = button.closest("form");
    const feedback = form?.querySelector(".save-feedback");

    if (feedback) {
      feedback.textContent = button.dataset.message;
    }
  });
});

importDemoButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const form = button.closest("form");
    const textInputs = form?.querySelectorAll('input[type="text"], input[type="email"]');

    if (!textInputs || textInputs.length < 4) return;

    textInputs[1].value = "Andrea Usuario01";
    textInputs[2].value = "1020304050";
    textInputs[3].value = "andrea.usuario@example.com";
    button.textContent = "Importado";
  });
});

changePasswordButton?.addEventListener("click", () => {
  const currentPassword = document.getElementById("current-password").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const feedback = document.getElementById("password-feedback");

  feedback.classList.remove("error-feedback");

  if (currentPassword !== "Orienta123") {
    feedback.textContent = "La contrasena actual no es correcta.";
    feedback.classList.add("error-feedback");
    return;
  }

  if (newPassword.length < 8) {
    feedback.textContent = "La nueva contrasena debe tener al menos 8 caracteres.";
    feedback.classList.add("error-feedback");
    return;
  }

  if (newPassword !== confirmPassword) {
    feedback.textContent = "La confirmacion no coincide con la nueva contrasena.";
    feedback.classList.add("error-feedback");
    return;
  }

  feedback.textContent = "Contrasena actualizada correctamente.";
  document.getElementById("password-form").reset();
});

saveProfessionalRateButton?.addEventListener("click", () => {
  const rateInput = document.getElementById("professional-rate-input");
  const feedback = document.getElementById("rate-feedback");
  const rate = Number(rateInput.value);

  feedback.classList.remove("error-feedback");

  if (rate < 750 || rate > 1500) {
    feedback.textContent = "La tarifa debe estar entre $750 y $1.500 COP.";
    feedback.classList.add("error-feedback");
    return;
  }

  feedback.textContent = `Tarifa actualizada a $${rate.toLocaleString("es-CO")} COP por minuto.`;
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
