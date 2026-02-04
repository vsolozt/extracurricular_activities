document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helpers para iniciales y id seguro
  function getInitials(email) {
    const local = (email || "").split("@")[0] || "";
    const parts = local.split(/[._\-]/).filter(Boolean);
    if (parts.length === 1) return (parts[0][0] || "?").toUpperCase();
    return ((parts[0][0] || "") + (parts[parts.length - 1][0] || "")).toUpperCase();
  }

  function safeId(name) {
    return "participants-" + name.replace(/\s+/g, "-").replace(/[^\w-]/g, "").toLowerCase();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build avatars row (up to 5) and +N badge
        const avatarsContainer = document.createElement("div");
        avatarsContainer.className = "avatars";

        const maxAvatars = 5;
        details.participants.slice(0, maxAvatars).forEach((p) => {
          const avatar = document.createElement("div");
          avatar.className = "avatar";
          avatar.title = p;
          avatar.textContent = getInitials(p);
          avatarsContainer.appendChild(avatar);
        });

        if (details.participants.length > maxAvatars) {
          const more = document.createElement("div");
          more.className = "more-badge";
          more.textContent = `+${details.participants.length - maxAvatars}`;
          avatarsContainer.appendChild(more);
        }

        if (details.participants.length === 0) {
          const none = document.createElement("div");
          none.className = "no-participants";
          none.textContent = "No hay participantes";
          avatarsContainer.appendChild(none);
        }

        // Collapsible full list
        const listId = safeId(name);
        const participantList = document.createElement("ul");
        participantList.className = "participant-list hidden";
        participantList.id = listId;
        details.participants.forEach((p) => {
          const li = document.createElement("li");
          li.className = "participant-item";

          const avatarSmall = document.createElement("span");
          avatarSmall.className = "avatar small";
          avatarSmall.title = p;
          avatarSmall.textContent = getInitials(p);

          const emailSpan = document.createElement("span");
          emailSpan.className = "participant-email";
          emailSpan.textContent = p;

          const removeBtn = document.createElement("button");
          removeBtn.className = "remove-btn";
          removeBtn.type = "button";
          removeBtn.setAttribute("aria-label", `Remove ${p}`);
          removeBtn.textContent = "\u2715";

          removeBtn.addEventListener("click", async () => {
            try {
              const res = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`, {
                method: "DELETE",
              });

              const data = await res.json();

              if (res.ok) {
                messageDiv.textContent = data.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
                fetchActivities();
                setTimeout(() => messageDiv.classList.add("hidden"), 4000);
              } else {
                messageDiv.textContent = data.detail || "Failed to remove participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            } catch (err) {
              messageDiv.textContent = "Failed to remove participant. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error removing participant:", err);
            }
          });

          li.appendChild(avatarSmall);
          li.appendChild(emailSpan);
          li.appendChild(removeBtn);

          participantList.appendChild(li);
        });

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "toggle-btn";
        toggleBtn.setAttribute("aria-controls", listId);
        toggleBtn.setAttribute("aria-expanded", "false");
        toggleBtn.textContent = "Ver participantes";
        toggleBtn.addEventListener("click", () => {
          const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
          toggleBtn.setAttribute("aria-expanded", String(!expanded));
          participantList.classList.toggle("hidden");
          toggleBtn.textContent = expanded ? "Ver participantes" : "Ocultar participantes";
        });

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activityCard.appendChild(avatarsContainer);
        activityCard.appendChild(toggleBtn);
        activityCard.appendChild(participantList);

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
        fetchActivities(); // refresh UI so participantes se actualizan
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

  // Initialize app
  fetchActivities();

  // Auto-refresh activities every 3 seconds
  setInterval(fetchActivities, 3000);
});
