document.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-type]");
  if (!button || button.disabled) return;

  if (button.dataset.type === "remove") {
    const id = button.dataset.id;
    remove(id).then(() => {
      event.target.closest("li").remove();
    });
  }

  if (button.dataset.type === "edit") {
    const item = button.closest("li");
    const titleElement = item.querySelector("[data-note-title]");

    const title = prompt("Введите новое название", titleElement.textContent);

    if (title === null) return;
    const newTitle = title.trim();
    if (!newTitle) {
      alert("Введите непустое название заметки");
      return;
    }

    const buttons = item.querySelectorAll("button");
    buttons.forEach((button) => (button.disabled = true));
    try {
      const note = await update(button.dataset.id, newTitle);

      titleElement.textContent = note.title;
    } catch (error) {
      alert(error.message);
    } finally {
      buttons.forEach((button) => (button.disabled = false));
    }
  }
});

async function remove(id) {
  await fetch(`/${id}`, { method: "DELETE" });
}

async function update(id, title) {
  const response = await fetch(`/${encodeURIComponent(id)}`, {
    method: "PUT",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Не удалось сохранить заметку (${response.status})`,
    );
  }

  return response.json();
}
