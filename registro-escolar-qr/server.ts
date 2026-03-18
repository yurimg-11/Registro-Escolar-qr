import express from 'express';
import Database from 'better-sqlite3';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const app = express();
app.use(express.json());

// Initialize SQLite Database
const db = new Database('attendance.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    folio TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    group_name TEXT NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folio TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (folio) REFERENCES students(folio)
  );
`);

// Seed initial data if empty
const count = db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number };
if (count.count === 0) {
  const insertStudent = db.prepare('INSERT INTO students (folio, name, group_name) VALUES (?, ?, ?)');
  insertStudent.run('12345', 'Juan Pérez', '3A');
  insertStudent.run('67890', 'María García', '5B');
  insertStudent.run('11111', 'Carlos López', '1C');
}

// API Routes

// Get all students
app.get('/api/students', (req, res) => {
  try {
    const students = db.prepare('SELECT * FROM students ORDER BY name ASC').all();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
});

// Add a new student
app.post('/api/students', (req, res) => {
  const { folio, name, group_name } = req.body;
  if (!folio || !name || !group_name) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  
  try {
    db.prepare('INSERT INTO students (folio, name, group_name) VALUES (?, ?, ?)').run(folio, name, group_name);
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      res.status(400).json({ error: 'El folio ya existe' });
    } else {
      res.status(500).json({ error: 'Error al registrar estudiante' });
    }
  }
});

// Scan QR code (Register entry or exit)
app.post('/api/scan', (req, res) => {
  const { folio } = req.body;
  if (!folio) {
    return res.status(400).json({ error: 'Folio no proporcionado' });
  }

  try {
    const student = db.prepare('SELECT * FROM students WHERE folio = ?').get(folio);

    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // Determine if it's an entry or exit based on the last log today
    const lastLog = db.prepare(`
      SELECT type FROM logs 
      WHERE folio = ? AND date(timestamp, 'localtime') = date('now', 'localtime')
      ORDER BY timestamp DESC LIMIT 1
    `).get(folio) as { type: string } | undefined;

    const newType = lastLog?.type === 'ENTRADA' ? 'SALIDA' : 'ENTRADA';

    db.prepare('INSERT INTO logs (folio, type) VALUES (?, ?)').run(folio, newType);

    res.json({
      student,
      type: newType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar el escaneo' });
  }
});

// Get recent logs
app.get('/api/logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT l.id, l.folio, l.type, l.timestamp, s.name, s.group_name
      FROM logs l
      JOIN students s ON l.folio = s.folio
      ORDER BY l.timestamp DESC
      LIMIT 100
    `).all();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener registros' });
  }
});

// Start Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
