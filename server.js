const express = require('express');
const PORT = process.env.PORT || 4000;
const bodyParser = require('body-parser');
const cors= require('cors');
const db = require('./app/models');
const { errors } = require("celebrate");
const app = express();

app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
async function connectDB() {
    const options = {
        useNewUrlParser: true,
    };

    try {
        console.log("Connecting to MongoDB...");
        db.mongoose
            .connect(db.url, options)
            .then(() => {
                console.log("Connected to the database!");
            })
            .catch((err) => {
                console.log("Cannot connect to the database!", err);
                process.exit();
            });

        db.mongoose.connection.on("disconnected", function () {
            console.log("MongoDB disconnected");
        });

        db.mongoose.connection.on("reconnected", function () {
            console.log("MongoDB reconnected");
        });

        db.mongoose.connection.on("error", function (err) {
            console.log("MongoDB error: " + err);
        });
    } catch (err) {
        console.error("Cannot connect to the database!", err);
        process.exit(1);
    }
}

connectDB();

app.get("/", (req, res) => {
    res.status(200).send("Server is up and running");
});

// Routes
require("./app/routes/User/user.route")(app);

app.use(errors());
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;

