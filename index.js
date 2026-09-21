const express = require("express");

const chalk = require("chalk");
const path = require("path");

const {
  addNote,
  getNotes,
  removeNote,
  updateNote,
} = require("./notes.controller");

const port = 3000;

const app = express();

app.set("view engine", "ejs");

app.set("views", "pages");

app.use(express.static(path.resolve(__dirname, "public")));

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(express.json());

app.get("/", async (req, res) => {
  res.render("index", {
    title: "Express App",

    notes: await getNotes(),
    created: false,
  });
});

app.post("/", async (req, res) => {
  await addNote(req.body.title);

  res.render("index", {
    title: "Express App",
    notes: await getNotes(),
    created: true,
  });
});

app.delete("/:id", async (req, res) => {
  await removeNote(req.params.id);

  res.render("index", {
    title: "Express App",
    notes: await getNotes(),
    created: false,
  });
});

app.put("/:id", async (req, res) => {
  const title = req.body?.title;

  if (typeof title !== "string" || !title.trim()) {
    return res
      .status(400)
      .json({ message: "Введите непустое название заметки" });
  }

  try {
    const note = await updateNote(req.params.id, title.trim());
    if (!note) {
      return res.status(404).json({ message: "Заметка не найдена" });
    }

    res.json(note);
  } catch (error) {
    console.error("Не удалось изменить заметку:", error);
    res.status(500).json({ message: "Не удалось сохранить заметку" });
  }
});

app.listen(port, () => {
  console.log(chalk.green(`Server has been started on port ${port}...`));
});
