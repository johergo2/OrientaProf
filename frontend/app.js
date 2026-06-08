const screens = document.querySelectorAll(".screen");
const screenButtons = document.querySelectorAll("[data-screen]");
const tabButtons = document.querySelectorAll("[data-tab]");
const authActions = document.querySelectorAll(".auth-action");
const helpButton = document.querySelector(".help-button");
const helpPanel = document.querySelector("#help-panel");
const helpClose = document.querySelector(".help-close");

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
    const selectedRole = document.querySelector('input[name="profile-role"]:checked');
    showScreen(selectedRole.value);
  });
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
