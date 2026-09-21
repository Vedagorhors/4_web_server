// это клиентский JavaScript и его можно запустить на NodeJS, но у нас другая задача
// Подключим данный файлв index.ejs с помощью script
// чтобы реализовать динамическое удаление элементов нам потребуется понять по каким элементам осуществляется клик. Сделаем с помощью делегирования
document.addEventListener("click", async (event) => {
  // найдем кнопку, даже если кликнули по элементу внутри неё. Клики по остальной странице пропускаем
  const button = event.target.closest("button[data-type]");
  if (!button || button.disabled) return;
  // обработаем аттрибут data-type="remove" из файла index.ejs
  if (button.dataset.type === "remove") {
    const id = button.dataset.id;
    remove(id).then(() => {
      // обновить интерфейс после удаления заметки.
      //   event.target.parentNode.remove();
      // Чтобы верно удалить, давайте привяжемся к классу или тэгу li, потому что если привязаться к крестику, то нужно именно на него нажать, а не на всю кнопку удаления, поэтому сделаем так:
      event.target.closest("li").remove();
    });
    // console.log("remove", id);
  }

  // теперь обработаем кнопку редактирования в том же обработчике кликов
  if (button.dataset.type === "edit") {
    const item = button.closest("li");
    const titleElement = item.querySelector("[data-note-title]");
    // вторым параметром prompt передадим текущее название, чтобы оно сразу появилось в поле ввода
    const title = prompt("Введите новое название", titleElement.textContent);

    // при нажатии Отмена или Escape получим null. Ничего не меняем и запрос не отправляем
    if (title === null) return;
    const newTitle = title.trim();
    if (!newTitle) {
      alert("Введите непустое название заметки");
      return;
    }

    // пока сохраняем заметку, отключим её кнопки, чтобы не отправлять повторные запросы
    const buttons = item.querySelectorAll("button");
    buttons.forEach((button) => (button.disabled = true));
    try {
      const note = await update(button.dataset.id, newTitle);
      // меняем текст только после успешного ответа. textContent не превращает введенные теги в HTML
      titleElement.textContent = note.title;
    } catch (error) {
      // при ошибке старое название остается на странице, а пользователь увидит сообщение
      alert(error.message);
    } finally {
      // finally выполнится и при успехе, и при ошибке. Вернем возможность нажимать кнопки
      buttons.forEach((button) => (button.disabled = false));
    }
  }
});

// выполняем запрос
async function remove(id) {
  await fetch(`/${id}`, { method: "DELETE" });
}

// отправим новое название на сервер. id помещаем в адрес, а title передаем в JSON
async function update(id, title) {
  const response = await fetch(`/${encodeURIComponent(id)}`, {
    method: "PUT",
    // по этому заголовку express.json поймет, что в теле запроса находится JSON
    headers: { "Content-Type": "application/json" },
    // преобразуем объект JavaScript в строку для отправки по сети
    body: JSON.stringify({ title }),
  });

  // fetch не выбрасывает ошибку при статусах 400, 404 или 500, поэтому проверяем response.ok сами
  if (!response.ok) {
    // если сервер вернул не JSON, все равно покажем понятное сообщение со статусом ответа
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Не удалось сохранить заметку (${response.status})`);
  }
  // преобразуем JSON из ответа обратно в объект с id и title
  return response.json();
}

// Express обрабатывает получение страницы, создание и удаление заметок.
// EJS выводит список и кнопки удаления.
// Клиентский JavaScript через fetch() отправляет DELETE-запрос и удаляет соответствующий <li>.
// Контроллер читает и сохраняет заметки в db.json
