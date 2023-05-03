const path = require("node:path");
const express = require("express");

const app = express();

app.use(express.static(path.join(process.cwd(), "public")));
app.listen(process.env.PORT);
