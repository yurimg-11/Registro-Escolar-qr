import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Configuración de la conexión
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Licenciado1@.', 
  database: 'Registro_escolar'
});

// 2. Ruta para registrar la asistencia desde el QR
app.post('/api/registrar', (req, res) => {
  const { matricula } = req.body;

  // Primero buscamos si el alumno existe para obtener su Nombre y Grupo
  const sqlAlumno = "SELECT nombre, grupo FROM alumnos WHERE matricula = ?";
  
  db.query(sqlAlumno, [matricula], (err, result: any) => {
    if (err) return res.status(500).json({ error: "Error en el servidor" });

    if (result.length > 0) {
      const alumno = result[0];

      // Si existe, insertamos en 'asistencias' para que MySQL genere el FOLIO (id autoincrementable)
      const sqlAsistencia = "INSERT INTO asistencias (matricula) VALUES (?)";
      
      db.query(sqlAsistencia, [matricula], (err, resAsistencia: any) => {
        if (err) return res.status(500).json({ error: "Error al generar folio" });

        // Devolvemos al Frontend todo lo que necesita mostrar en pantalla
        res.json({
          folio: resAsistencia.insertId, // Este es el ID automático de la BD
          nombre: alumno.nombre,
          grupo: alumno.grupo,
          mensaje: "Registro exitoso"
        });
      });
    } else {
      res.status(404).json({ mensaje: "Alumno no encontrado en la base de datos" });
    }
  });
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});