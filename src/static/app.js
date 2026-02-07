document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Escapa texto para uso seguro dentro de innerHTML (especialmente emails)
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => {
      const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
      return map[ch] || ch;
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";


        const participants = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = details.max_participants - participants.length;

        // Participantes sin bullet-points y con botón X
        const participantsHtml =
          participants.length > 0
            ? `<div class="participants-list no-bullets">
                ${participants.map((p) => `
                  <span class="participant-chip">
                    ${escapeHtml(p)}
                    <button class="remove-participant" data-activity="${encodeURIComponent(name)}" data-email="${escapeHtml(p)}" title="Eliminar participante">✖</button>
                  </span>
                `).join("")}
               </div>`
            : `<p class="participants-empty">Aún no hay participantes.</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <details class="participants">
            <summary>
              Participantes <span class="participants-count">${participants.length}</span>
            </summary>
            ${participantsHtml}
          </details>
        `;


        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // <-- Recarga la lista de actividades tras alta exitosa
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegación de eventos para eliminar participante
  document.addEventListener("click", async (event) => {
    if (event.target.classList.contains("remove-participant")) {
      const activity = event.target.getAttribute("data-activity");
      const email = event.target.getAttribute("data-email");
      if (confirm(`¿Eliminar a ${email} de la actividad "${decodeURIComponent(activity)}"?`)) {
        try {
          const response = await fetch(`/activities/${activity}/remove?email=${encodeURIComponent(email)}`, {
            method: "POST"
          });
          if (response.ok) {
            fetchActivities();
          } else {
            const result = await response.json();
            alert(result.detail || "No se pudo eliminar el participante.");
          }
        } catch (error) {
          alert("Error al eliminar participante.");
        }
      }
    }
  });

  // Initialize app
  fetchActivities();
});
