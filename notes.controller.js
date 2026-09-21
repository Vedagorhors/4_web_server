const fs = require("fs/promises");
const path = require("path");
const chalk = require("chalk");

const notesPath = path.join(__dirname, "db.json");

async function addNote(title) {
  const notes = await getNotes();
  const note = {
    title,
    id: Date.now().toString(),
  };

  notes.push(note);

  await saveNotes(notes);
  console.log(chalk.bgGreen("Note was added!"));
}

async function getNotes() {
  const notes = await fs.readFile(notesPath, { encoding: "utf-8" });
  return Array.isArray(JSON.parse(notes)) ? JSON.parse(notes) : [];
}

async function saveNotes(notes) {
  await fs.writeFile(notesPath, JSON.stringify(notes));
}

async function printNotes() {
  const notes = await getNotes();

  console.log(chalk.bgBlue("Here is the list of notes:"));
  notes.forEach((note) => {
    console.log(chalk.bgWhite(note.id), chalk.blue(note.title));
  });
}

async function removeNote(id) {
  const notes = await getNotes();

  const filtered = notes.filter((note) => note.id !== id);

  await saveNotes(filtered);
  console.log(chalk.red(`Note with id="${id}" has been removed.`));
}

// теперь добавим редактирование. Передадим id заметки и её новое название
async function updateNote(id, title) {
  // сначала прочитаем все заметки, а затем найдем нужную по id
  const notes = await getNotes();
  const note = notes.find((note) => note.id === id);

  // если заметки уже нет, вернем null. Сервер проверит это и отправит ошибку 404
  if (!note) {
    return null;
  }

  // find вернул сам объект из массива, поэтому здесь меняем название и в массиве notes. id оставляем прежним
  note.title = title;
  // ждем сохранения в db.json, чтобы отправить браузеру результат только после записи
  await saveNotes(notes);
  return note;
}

module.exports = {
  // addNote, printNotes, removeNote
  addNote,
  getNotes,
  removeNote,
  // экспортируем функцию, чтобы использовать её в index.js
  updateNote,
};
