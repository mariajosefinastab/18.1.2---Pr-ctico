const express = require("express");
const mariadb = require("mariadb");

const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "planning",
  connectionLimit: 5,
});

const app = express();
const port = 3008;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("<h1>Bienvenid@ al servidor de Task</h1>");
});


//Todas las tareas
app.get("/tasks", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      "SELECT id, name, description, created_at, updated_at, status FROM todo"
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Se rompió el servidor" });
  } finally {
    if (conn) conn.release(); //release to pool
  }
});

//Tarea por ID
app.get("/tasks/:id", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      "SELECT * FROM todo WHERE id=?", //¿?
      [req.params.id]
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(404).json({ message: "Tarea no encontrada por ID" });
  } finally {
    if (conn) conn.release(); //release to pool
  }
});

//Nueva tarea, valido si esa tarea existe y su estado, sino la agrego
app.post("/tasks", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { name, description, status } = req.body;

    //valida status

    const validStatuses = ["TO_DO", "IN_PROGRESS", "DONE"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    const response = await conn.query(
      `INSERT INTO todo(name, description, status) VALUES (?, ?, ?)`,
      [name, description, status]
    );

    res.json({
      id: response.insertId,
      name,
      description,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: "Se rompió el servidor" });
  } finally {
    if (conn) conn.release();
  }
});


// Actualizar una tarea por id
app.put("/tasks/:id", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { name, description, status } = req.body;
    const taskId = req.params.id;

    const validStatuses = ["TO_DO", "IN_PROGRESS", "DONE"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    const response = await conn.query(
      `UPDATE todo SET name=?, description=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [name, description, status, taskId]
    );

    if (response.affectedRows === 0) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    res.json({
      id: taskId,
      name,
      description,
      status,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Se rompió el servidor" });
  } finally {
    if (conn) conn.release();
  }
});


// Eliminar una tarea por id
app.delete("/tasks/:id", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const taskId = req.params.id;

    const response = await conn.query("DELETE FROM todo WHERE id=?", [
      taskId,
    ]);

    if (response.affectedRows === 0) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    res.json({ message: "Tarea eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Se rompió el servidor" });
  } finally {
    if (conn) conn.release(); 
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

