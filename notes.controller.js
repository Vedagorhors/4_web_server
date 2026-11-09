// const fs = require("fs/promises"); - не нужен для работы с MongoDB и mongoose
// const path = require("path"); - не нужен для работы с MongoDB и mongoose
const chalk = require("chalk");
// подключаю созданную базу данных, чтобы переключиться на неё с файла db.json
const Note = require("./models/Note");
const { log } = require("console");

// const notesPath = path.join(__dirname, "db.json"); - не нужен для работы с MongoDB и mongoose
// добавим собственника заметку
async function addNote(title, owner) {
  // оставим старый вариант для сравнения: раньше добавляли заметку в массив и сохраняли его в db.json
  // получаем заметку
  // const notes = await getNotes();
  // // создаем новую заметку
  // const note = {
  //   title,
  //   id: Date.now().toString(),
  // };
  // // новая заметка добавляется в массив notes
  // notes.push(note);
  // // вызывается сохранение
  // await saveNotes(notes);
  // теперь читаем заметки из MongoDB, поэтому и новую заметку нужно сохранить туда же
  // create проверит данные по схеме, создаст документ с _id и запишет его в коллекцию notes
  // сохраним собственника в базе
  await Note.create({ title, owner });
  console.log(chalk.bgGreen("Note was added!"));
}

async function getNotes() {
  // const notes = await fs.readFile(notesPath, { encoding: "utf-8" });
  // используем у этой модели метод find
  const notes = await Note.find();
  // посмотрим что выводит метод find в косоли
  // console.log(notes);
  // для проверки выведем из массива notes значение .id
  // console.log(notes[0].id);
  //проверим что это строка и это да строка
  // console.log(typeof notes[0].id);

  // return Array.isArray(JSON.parse(notes)) ? JSON.parse(notes) : []; - не надо, так как у нас и так данные правильно приходят в виде массива с базы данных, достаточно вернуть notes
  return notes;
}

// saveNotes не нужен для работы с MongoDB и mongoose
// async function saveNotes(notes) {
//   await fs.writeFile(notesPath, JSON.stringify(notes));
// }

// printNotes не нужен для работы с MongoDB и mongoose
// async function printNotes() {
//   const notes = await getNotes();

//   console.log(chalk.bgBlue("Here is the list of notes:"));
//   notes.forEach((note) => {
//     console.log(chalk.bgWhite(note.id), chalk.blue(note.title));
//   });
// }

async function removeNote(id, owner) {
  // для работы с mongoose, база данных в MongoDB. Смотрим на сайте https://mongoosejs.com/docs/models.html как делать удаление и применяем метод deleteOne и в нем передаем id:
  const result = await Note.deleteOne({ _id: id, owner });

  if (result.matchedCount === 0) {
    throw new Error("No note to delete");
  }
  // ниже код использовался с db.json, а теперь мы сделали с mongoose, база данных в MongoDB
  // // получим заметку
  // const notes = await getNotes();
  // // фильтруем заметку
  // const filtered = notes.filter((note) => note.id !== id);
  // // сохраняем заметку
  // await saveNotes(filtered);
  console.log(chalk.red(`Note with id="${id}" has been removed.`));
}

async function updateNote(noteData, owner) {
  // заменим код обновления/редактрования заметок под работу с mongoose, база данных в MongoDB
  // смотрим как делается обновление в документации: https://mongoosejs.com/docs/models.html
  // в updateOne первым аргументом передаем объект для фильтрации, то есть какие документы мы хотим обновить, а вторым аргументом передаем что мы хотим изменить в документе, а мы хотим изменить title
  const result = await Note.updateOne(
    { _id: noteData.id, owner },
    { title: noteData.title },
  );
  // console.log(result); - в консоли выдаст следующее:
  // {
  //   acknowledged: true,
  //   modifiedCount: 0,
  //   upsertedId: null,
  //   upsertedCount: 0,
  //   matchedCount: 0
  // }
  // то есть нули, ничего не произошло. Сделаем проверку
  if (result.matchedCount === 0) {
    throw new Error("No note to edit");
  }

  // это старый код обновления или редактирования заметок, когда мы работали с db.json
  // const notes = await getNotes();
  // const index = notes.findIndex((note) => note.id === noteData.id);
  // if (index > 0) {
  //   notes[index] = { ...notes[index], ...noteData };
  //   await saveNotes(notes);
  console.log(chalk.bgGreen(`Note with id="${noteData.id}" has been updated!`));
}

// Это второй варант обновления заметок, то есть редактирование. теперь добавим редактирование. Передадим id заметки и её новое название
// async function updateNote(id, title) {
//   // сначала прочитаем все заметки, а затем найдем нужную по id
//   const notes = await getNotes();
//   const note = notes.find((note) => note.id === id);

//   // если заметки уже нет, вернем null. Сервер проверит это и отправит ошибку 404
//   if (!note) {
//     return null;
//   }

//   // find вернул сам объект из массива, поэтому здесь меняем название и в массиве notes. id оставляем прежним
//   note.title = title;
//   // ждем сохранения в db.json, чтобы отправить браузеру результат только после записи
//   await saveNotes(notes);
//   return note;
// }

module.exports = {
  // addNote, printNotes, removeNote
  addNote,
  getNotes,
  removeNote,
  // экспортируем функцию, чтобы использовать её в index.js
  updateNote,
};
