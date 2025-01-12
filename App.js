const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
require("dotenv/config");


app.use(cors());
app.options("*", cors());

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));

//eto muna para publicly accessed photos
app.use("/public", express.static(__dirname + "/public"));
app.use(authJwt());
app.use(errorHandler);




//Routes
const usersRoutes = require("./routes/users");
const diseasesRoutes = require("./routes/diseases");
const medicationcategoryRoutes = require("./routes/medication-category");
const medicineRoutes = require("./routes/medicine");
const pharmacyRoutes = require("./routes/pharmacy");
const barangayRoutes = require("./routes/barangay");
const customerRoutes = require("./routes/customers");

const api = process.env.API_URL;


app.use(`${api}/users`, usersRoutes);
app.use(`${api}/customers`, customerRoutes);
app.use(`${api}/diseases`, diseasesRoutes);
app.use(`${api}/medication-category`, medicationcategoryRoutes);
app.use(`${api}/medicine`, medicineRoutes);
app.use(`${api}/pharmacies`, pharmacyRoutes);
app.use(`${api}/barangays`, barangayRoutes);


//Database
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database Connection is ready...");
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(4000, () => {
  console.log("server is running http://localhost:4000");
});
