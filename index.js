import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express()
const port = 3000

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "books",
    password: ".look@z*",
    port : 5432

})

db.connect()

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM books');
        const books = result.rows; // Get the rows from the query result
        res.render("index.ejs", { books });
    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).send("Error fetching books");
    }
});

app.get("/add", async (req, res) => {
    res.render("add.ejs")
})

app.get('/api/books/:isbn', async (req, res) => {
    const isbn = req.params.isbn;
    try {
        const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`);
        res.json({ cover: response.data });
    } catch (error) {
        console.error("error fetching cover:", error);
        res.status(500).send("error fetching cover")
    }
})

app.post('/add', async (req, res) => {
    const { title, author, rating, date_read, notes, isbn } = req.body;
    try {
        const newBook = await db.query('INSERT INTO books (title, author, rating, date_read, notes, isbn) VALUES ($1, $2, $3, $4, $5, $6) RETURNING * ', [title, author, rating, date_read, notes, isbn]);
        res.redirect("/");

    } catch (error) {
        console.error("error adding book:", error);
        res.status(500).send("error adding book .")
    }
})

app.post("/delete/:id", async (req, res) => {
    const bookId = parseInt(req.params.id);
    console.log("deleting book with id :", bookId);
    // Accessing id from req.params
    try {
        await db.query('DELETE FROM books WHERE id = $1', [bookId]);
        res.redirect("/");
    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).send("Error deleting book");
    }
});
app.route("/edit/:id")
    .get(async (req, res) => {
        const bookId = parseInt(req.params.id);
        try {
            const result = await db.query('SELECT * FROM books WHERE id = $1', [bookId]);
            const book = result.rows[0];
            if (book) {
                res.render("edit.ejs", { book });
            } else {
                res.status(500).send("book not found")
            }
        } catch (error) {
            console.error("error fetching book for editing :", error);
            res.status(500).send("error fetching book")
        }
    })
    .post(async (req, res) => {
        const bookId = parseInt(req.params.id);
        const { title, author, rating, date_read, notes, isbn } = req.body;
        try {
            await db.query(
                'UPDATE books SET title = $1, author = $2, rating = $3, date_read = $4, notes = $5, isbn = $6 WHERE id = $7',
                [title, author, rating, date_read, notes, isbn, bookId]
            );
            res.redirect("/");
        } catch (error) {
            console.error("error updating book:", error);
            res.status(500).send("error updating book")
        }
})
app.listen(port, () => {
     console.log(`Server running on port ${port}`);
})