// потом для размещения приложения на облачном сервере необходимо подключить  dotenv командой в терминале: npm i dotenv.
// чтобы созданный файл .env был прочитан, нужно подключить dotenv. Это делается один раз и чаще всего в основном файле нашего приложения, то есть в index.js.  Итак подключаем его и вызываем у него метод конфигурации config()
// Теперь модуль dotenv прочитает файл .env, вытащит из него все переменные, сложит в process.env  и мы сможем получить к этим переменным допуск через process.env
require("dotenv").config();

// после установки фреймворка express (см инфу на сайте https://expressjs.com/), подключаем его:
const express = require("express");

const chalk = require("chalk");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
// const Note = require("./models/Note"); - не нужен для работы с MongoDB и mongoose

// const path = require("path"); // эта запись уже не нужна для ejs.
const {
  addNote,
  getNotes,
  removeNote,
  updateNote,
} = require("./notes.controller");

// подключи контроллеры addUser и позже loginUser
const { addUser, loginUser } = require("./users.controller");

const auth = require("./middliwares/auth");

// const { error } = require("console");

// Задаём порт — номер, по которому браузер сможет обратиться к нашему серверу: http://localhost:3000.
const port = 3000;

// создадим базовый путь до папки pages
// const basePath = path.join(__dirname, "pages"); // эта запись уже не нужна для ejs.

// для express создадим объект app. На сайте https://expressjs.com/ всё написано
const app = express();

// Как передавать данные с сервера в браузер? То есть мы хотим вывести на страницу в браузер наши заметки из базы данных. Воспользуемся тем, что мы работаем с Express. Мы уже не сможем рабоать с форматом html и нам потребуется шаблонизатор, позволяющий формировать html на основе тех данных, которые сделаем на сервере. Установили командой npm i ejs пакет ejs (Embedded JavaScript templates): https://www.npmjs.com/package/ejs. Теперь мы можем с помощью JavaScript конструкции формировать HTML. ejs очень хорошо тем, что он хорошо интегрируется с Express, но есть и другие шаблонизаторы, это HandleBars, Pack  и др.
// После того, как мы создали наше приложение, необходио поменять некоторые базовые настройки в Express с помощью команды set. Указываем каким шаблонизатором (ejs) мы пользуемся, пишем 'view engine', 'ejs'
app.set("view engine", "ejs");
// Express думает, что все страницы, которые нужны для работы нашего приложения лежат в папке views, а на самом деле у нас папка pages, поэтому перенаправим его с views на pages
app.set("views", "pages");
// Теперь перименуем файл index.html в index.ejs

// Метод use() используется для применения промежуточного обработчика (middleware) к маршруту или приложению. Отталкиваеся от папки public, где мы сейчас находимся
app.use(express.static(path.resolve(__dirname, "public")));

// нужно научить express понимать с какими данными мы работаем и в каком формате их принимаем
// после того, как мы проинициализировали приложение, мы с помощью метода use добавим новый функционал
// для редактирования будем отправлять JSON через fetch. Этот middleware разберет JSON и положит данные в req.body
// добавляем его до маршрутов.
app.use(express.json());
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
  }),
);
// пишем в браузере текст, например 1234 в поле ввода и получаем ответ в консоли: { title: '1234' }

app.get("/login", async (req, res) => {
  res.render("login", {
    title: "Express App",
    error: undefined,
  });
});

// подключим обработчик
app.post("/login", async (req, res) => {
  // здесь нужно будет вызвать обработчик логина - контроллер логина, который мы создадим и дальше, если есть ошибка - отрендерить наш шаблон или перейти на главную страницу если ошибки нет
  try {
    // вызовем подключенный loginUser
    const token = await loginUser(req.body.email, req.body.password);

    res.cookie("token", token, { httpOnly: true });
    // перенаправим на главную страницу, если все хорошо
    res.redirect("/");
  } catch (e) {
    res.render("login", {
      title: "Express App",
      error: e.message,
    });
  }
});

app.get("/register", async (req, res) => {
  res.render("register", {
    title: "Express App",
    error: undefined,
  });
});

app.post("/register", async (req, res) => {
  // теперь  у нас есть функция addUser. Вызовем её в try/catch, потому что создание пользователя может завершится неуспешно, например, из-за валидации
  try {
    await addUser(req.body.email, req.body.password);
    // если есть ошибка, то будем рендерить обратно форму регистрации и отображать там эту ошибку. Если все хорошо, то было бы неплохо перекинуть пользователя на логин
    // для проверки запустим приложение и введем невалидный емаил qwe@qwe и любой пароль - на сайте выскочит ошибка: ValidationError: email: Invalid email. Ошибку ValidationError возвращает монгус, но эту ошибку пользователю не нужно показывать
    res.redirect("./login");
  } catch (e) {
    // console.log(e);
    if (e.code === 11000) {
      res.render("register", {
        title: "Express App",
        error: "Email is already registered",
      });
      // чтобы код не пошел нам рендерить шаблон еще раз - ставим return
      return;
    }
    res.render("register", {
      title: "Express App",
      error: e.message,
    });
  }
});

// Реализуем logout
app.get("/logout", (req, res) => {
  // обрабатываем запрос на logout  и очищаем токены с куки
  // Нужно защитить наш токен, чтобы не было к нему доступа с JavaScript. Потому что сейчас если я введу в девтулз команду dokument.cookie  и я получу наш токен. Дописываем { httpOnly: true } и теперь токен будет передаваться только в запросах и будет доступен только серверу и теперь браузер с помощью JavaScript не может получить доступ к токену и таким образом мы защитили наше приложение.
  res.cookie("token", "", { httpOnly: true });
  // перенаправляем пользователя на логин
  res.redirect("/login");
});

// Логин и регистрация должны быть доступны для всех, поэтому подключаем middleware только после них. То есть сначала отработают обработчики на логин и регистрацию, если пользователь пришел на них, а если нет и пользователь, например, хочет зайти на главную страницу, то нужно сначала проверить, а залогинен ли этот пользователь.
app.use(auth);

// Нам нужно зашифровать пароль с которы мпользователь зарегестрировался у нас на сайте. Обычно зашифрованный пароль называют хэш пароля. Для шифрования пароля установим пакет bcrypt командой npm i bcrypt

// GET-запрос. Передаем url, на который должны откликаться - это просто '/', а вторым параметром передаем коллбэк. Чтобы передать наш файл index.html используем метод sendFile
app.get("/", async (req, res) => {
  // res.sendFile(path.join(basePath, "index.html")); // эта запись уже не нужна для ejs. Теперь для того, чтобы отправить нужную страницу пользователю мы также обращаемся к res и вызываем метод render, куда мы передаем название файла, которое необходимо отрендерить, то есть index. Вторым параметром в метод render передадим объект с теми данными, которые нам нужны. Передаем на фронтенд параметр title - вставляем title в файле index.ejs.
  res.render("index", {
    title: "Express App",
    // Выведем и список заметок. Ждем пока прилетят все данные
    notes: await getNotes(),
    userEmail: req.user.email,
    created: false,
    error: false,
  });
});
// теперь как получили данные, мы можем их вывести в index.ejs. Выведем в div с классом card

// POST-запрос
app.post("/", async (req, res) => {
  try {
    // специально вызовем ошибку, чтобы проверить блок catch. throw сразу переведёт выполнение в catch, заметка не сохранится, а на странице появится нужное сообщение Something went wrong!.
    // throw new Error("Проверяем сообщение об ошибке");

    // сначала сохраним заметку и позже добавили сюда параметр, который будет храниться в req.user.email и он тут будет всегда, потому что если его там не  будет, то наш middleware auth просто не пропустит запрос дальше, она перенаправит пользователя на логин
    await addNote(req.body.title, req.user.email);

    // затем сформируем страницу с обновленным списком
    res.render("index", {
      title: "Express App",
      notes: await getNotes(),
      userEmail: req.user.email,
      userEmail: req.user.email,
      created: true,
      error: false,
    });
  } catch (e) {
    console.error("Creation error", e);
    res.render("index", {
      title: "Express App",
      notes: await getNotes(),
      userEmail: req.user.email,
      created: false,
      error: true,
    });
  }
  // здесь  оставил предыдущий вариант
  // await addNote(title.trim()); // здесь потенциально можем обрабатывать ошибки
  // После того, как мы все это сохранили мы отправляем уже браузеру наш index.html
  // res.sendFile(path.join(basePath, "index.html")); // эта запись уже не нужна для ejs.
  //   res.render("index", {
  //     title: "Express App",
  //     notes: await getNotes(),
  //     created: true,
  //   });
  // });
});

// // console.log(req.body); // именно в req.body должны храниться те данные, которые мы получаем с фронтенда
// // сначала проверим тело запроса. Если оно не пришло или его формат не разобран, ?. вернет undefined
// const title = req.body?.title;
// // required проверяет поле в браузере, но на сервере тоже нужна проверка. Не дадим сохранить пустое название
// if (typeof title !== "string" || !title.trim()) {
//   // вернем ту же страницу с сообщением. Статус 400 означает ошибку в данных запроса, а не поломку сервера
//   return res.status(400).render("index", {
//     title: "Express App",
//     notes: await getNotes(),
//     created: false,
//     error: "Введите название заметки и отправьте форму ещё раз",
//   });
// }

// пишем в браузере в поле ввода From express и в db.json получим {"title":"From express","id":"1789642610897"}

// // для удаления элементов мы здесь уже применим почти технологию RAST-API. Здесь :id нужно понимать так - двоеточие это не строчка id, а я здесь жду какую-то величину,которую я интерпретирую именно как id.
app.delete("/:id", async (req, res) => {
  try {
    await removeNote(req.params.id, req.user.email);
    res.render("index", {
      title: "Express App",
      notes: await getNotes(),
      userEmail: req.user.email,
      userEmail: req.user.email,
      created: false,
      error: false,
    });
  } catch (e) {
    res.render("index", {
      title: "Express App",
      notes: await getNotes(),
      userEmail: req.user.email,
      userEmail: req.user.email,
      created: false,
      error: e.message,
    });
  }
});

app.put("/:id", async (req, res) => {
  try {
    await updateNote(
      { id: req.params.id, title: req.body.title },
      req.user.email,
    );
    res.render("index", {
      title: "Express App",
      notes: await getNotes(),
      userEmail: req.user.email,
      created: false,
      error: false,
    });
  } catch (e) {
    res.render("index", {
      title: "Express App",
      notes: await getNotes(),
      userEmail: req.user.email,
      created: false,
      error: e.message,
    });
  }
});

// app.delete("/:id", async (req, res) => {
//   try {
//     // Передаём id заметки и email её владельца.
//     // Email берём из req.user, который заполняет middleware auth.
//     await removeNote(req.params.id, req.user.email);

//     // Отправляем ответ браузеру после завершения удаления.
//     // Элемент заметки со страницы удаляет код в public/app.js.
//     res.json({ id: req.params.id });
//   } catch (e) {
//     // Устанавливаем HTTP-статус 500 и отправляем описание ошибки.
//     res.status(500).json({
//       message: e.message,
//     });
//   }
// });

// app.put("/:id", async (req, res) => {
//   try {
//     // Получаем название из JSON, отправленного браузером.
//     const title = req.body?.title;

//     // Проверяем, что пришла строка, содержащая не только пробелы.
//     if (typeof title !== "string" || !title.trim()) {
//       // return завершает обработчик: обновление ниже не выполнится.
//       return res.status(400).json({
//         message: "Введите непустое название заметки",
//       });
//     }

//     // Убираем лишние пробелы по краям названия.
//     const newTitle = title.trim();

//     // Обновляем заметку с указанным id, принадлежащую пользователю.
//     // Если контроллер выбросит ошибку, выполнение перейдёт в catch.
//     await updateNote({ id: req.params.id, title: newTitle }, req.user.email);

//     // Клиент получит объект и прочитает note.title,
//     // чтобы обновить название заметки без перезагрузки страницы.
//     res.json({
//       id: req.params.id,
//       title: newTitle,
//     });
//   } catch (e) {
//     // public/app.js проверит статус ответа и покажет message.
//     res.status(500).json({
//       message: e.message,
//     });
//   }
// });

// если тело запроса не передали, ?. вернет undefined вместо ошибки при обращении к title
// const title = req.body?.title;
// // проверим данные и на сервере: trim убирает пробелы по краям, пустое название сохранять не будем
// if (typeof title !== "string" || !title.trim()) {
//   return res
//     .status(400)
//     .json({ message: "Введите непустое название заметки" });
// }

// try {
//   // ждем, пока контроллер найдет заметку и сохранит новое название в файле
//   const note = await updateNote(req.params.id, title.trim());
//   if (!note) {
//     return res.status(404).json({ message: "Заметка не найдена" });
//   }

//   // отправляем обновленную заметку в JSON. Клиент возьмет отсюда название и обновит текст на странице
//   res.json(note);
// } catch (error) {
//   // если не получилось прочитать или записать файл, сообщим об этом и не будем показывать успешное сохранение
//   console.error("Не удалось изменить заметку:", error);
//   res.status(500).json({ message: "Не удалось сохранить заметку" });
// }
// });

// используем переменную mongoose, для того, чтобы работать с подключением к базе. Используем в connect ту же строку, что использовали в MongoDB Compass. Открываем MongoDB Atlas, далее DATABASE - Clusters и там выбираем Connect, в нем выбираем Drivers, потому что Mogoose под капотом ипользует MongoDB Driver. Кипируем путь, вставляем его сюда в код и подставляем наш пароль вместо <db_password>. После слэша / пишем имя базы данных с которой мы хотим работать, назовем её notes.
// Подключение к базе жанных не моментальное. Если будем подключаться параллельно со стартом нашего приложения, то можем не успеть подключиться и тогда первые запросы к приложению просто не смогут получить доступ к базе данных. Чтобы этого не произошло -  метод connect дает нам промис promise и внутри then мы уже стартуем наше приложение
// mongoose
//   .connect(
// здесь была моя строка подключения, но перед пушем на гитхаб я её перенес в .env а здесь ниже просто подключил эту переменную:
// mongoose.connect(process.env.MONGODB_URI)
// )
// строку подключения берем из .env. Команды npm start и npm run serve загружают её в process.env
mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING)
  // здесь будем использовать подключенную модель Note. Например, перед стартом приложения будем создавать тестовую заметку. Добавим async и добавим await, чтобы сначала создалась заметка, а только после этого запустилось приложение. Если вместо "test" просто записать пустую строку "", то база не создасться, не пройдет валидацию, здесь должна быть строка String. Валидацию эту мы задали в файле Note.js в описании схемы и это работает именно на стороне mongoose, не внутри базы, а до того, как запрос вообще пойдет к базе. Но мы можем добавить данные в самом приложении MongoDB Compass и тогда получится, что мы минуем валидацию и можем добавить и пустую строку
  // .then(async () => {
  .then(() => {
    // await Note.create({ title: "test" });
    // Запускаем прослушивание порта 3000, то есть запускаем наш сервер с помощью метода listen. Теперь сервер может принимать запросы.
    // Этот коллбэк вызывается после успешного начала прослушивания, а не при каждом запросе.
    // после установки express здесь вместо server нужно писать app (приложение)
    // server.listen(port, () => {
    app.listen(port, () => {
      // Обратные кавычки создают шаблонную строку: ${port} подставляет в неё значение 3000.
      // chalk.green() окрашивает сообщение в зелёный, а console.log() выводит его в терминал.
      console.log(chalk.green(`Server has been started on port ${port}...`));
    }); // Node.js продолжает ждать запросы, пока сервер работает.
  });
// Запускаем наше приложение командой npm run serve и видим, что приложение запустилось не сразу, а с задержкой.
// Теперь, чтобы работать с базой данных, например, для того, чтобы создавать документы, нам нужно для начала описать модель этих данных - создадим папку models и в ней создадим файл Note.js. Открываем приложение MongoDB Compass и видим, что бам добавилась база notes, коллекция notes и документ:
// _id ObjectId('6ab27db9beb7868480c23784') - это id созданного документа
// title "test" - это строка test, которую мы добавляли
// __v: 0 - это поле, которое использует mongoose для того, чтобы понимать, что у нас самая свежая версия документа.

// Express сам определяет с каким форматом данных мы работаем, поэтому он автоматически выставляет все хедеры (заголовки), доп. информацию для браузера, чтобы он лучше понимал что происходит. Например можно посмотреть в DevTools  в браузере в закладке Network (Сеть) что в заголовках появилась новая информация и одна из них это запись: x-powered-by Express - по этой записи мы определяем, что работаем с Express фреймворком
