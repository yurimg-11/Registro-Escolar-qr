import express from 'express';
import mysql from 'mysql2/promise';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import 'dotenv/config';

const app = express();
app.use(express.json());

// Initialize MySQL Database Pool
let pool: mysql.Pool | null = null;

async function initDB() {
  if (!process.env.DB_HOST) {
    console.warn('MySQL credentials not found in environment variables. Database will not be connected.');
    return;
  }

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        folio VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        group_name VARCHAR(255) NOT NULL
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        folio VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (folio) REFERENCES students(folio)
      )
    `);

    // Seed initial data if empty
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM students');
    if (rows[0].count === 0) {
      const insertQuery = 'INSERT INTO students (folio, name, group_name) VALUES (?, ?, ?)';
      await pool.query(insertQuery, ['12345', 'Juan Pérez', '3A']);
      await pool.query(insertQuery, ['67890', 'María García', '5B']);
      await pool.query(insertQuery, ['11111', 'Carlos López', '1C']);
    }
    console.log('MySQL Database initialized successfully');
  } catch (error) {
    console.error('Error initializing MySQL database:', error);
    pool = null;
  }
}

// Check DB middleware
const requireDB = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!pool) {
    return res.status(503).json({ error: 'Database not configured. Please set MySQL environment variables.' });
  }
  next();
};

// API Routes

// Get all students
app.get('/api/students', requireDB, async (req, res) => {
  try {
    const [students] = await pool!.query('SELECT * FROM students ORDER BY name ASC');
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
});

// Get a single student by folio
app.get('/api/students/:folio', requireDB, async (req, res) => {
  try {
    const [rows] = await pool!.query<mysql.RowDataPacket[]>('SELECT * FROM students WHERE folio = ?', [req.params.folio]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Estudiante no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar estudiante' });
  }
});

// Add a new student
app.post('/api/students', requireDB, async (req, res) => {
  const { folio, name, group_name } = req.body;
  if (!folio || !name || !group_name) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  
  try {
    await pool!.query('INSERT INTO students (folio, name, group_name) VALUES (?, ?, ?)', [folio, name, group_name]);
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'El folio ya existe' });
    } else {
      res.status(500).json({ error: 'Error al registrar estudiante' });
    }
  }
});

// Scan QR code (Register entry or exit)
app.post('/api/scan', requireDB, async (req, res) => {
  const { folio } = req.body;
  if (!folio) {
    return res.status(400).json({ error: 'Folio no proporcionado' });
  }

  try {
    const [studentRows] = await pool!.query<mysql.RowDataPacket[]>('SELECT * FROM students WHERE folio = ?', [folio]);

    if (studentRows.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    const student = studentRows[0];

    // Determine if it's an entry or exit based on the last log today
    const [logRows] = await pool!.query<mysql.RowDataPacket[]>(`
      SELECT type, timestamp FROM logs 
      WHERE folio = ? AND DATE(timestamp) = CURDATE()
      ORDER BY timestamp DESC LIMIT 1
    `, [folio]);

    const lastLog = logRows.length > 0 ? logRows[0] : undefined;
    const newType = lastLog?.type === 'ENTRADA' ? 'SALIDA' : 'ENTRADA';
    
    // MySQL returns Date objects for DATETIME fields by default in mysql2
    let entryTime = undefined;
    if (newType === 'SALIDA' && lastLog?.timestamp) {
      entryTime = lastLog.timestamp instanceof Date 
        ? lastLog.timestamp.toISOString() 
        : new Date(lastLog.timestamp).toISOString();
    }

    await pool!.query('INSERT INTO logs (folio, type) VALUES (?, ?)', [folio, newType]);

    res.json({
      student,
      type: newType,
      timestamp: new Date().toISOString(),
      entryTime
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar el escaneo' });
  }
});

// Get recent logs
app.get('/api/logs', requireDB, async (req, res) => {
  try {
    const [logs] = await pool!.query<mysql.RowDataPacket[]>(`
      SELECT l.id, l.folio, l.type, l.timestamp, s.name, s.group_name
      FROM logs l
      JOIN students s ON l.folio = s.folio
      ORDER BY l.timestamp DESC
      LIMIT 100
    `);
    
    // Ensure timestamps are properly formatted as ISO strings for the frontend
    const formattedLogs = logs.map(log => ({
      ...log,
      timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : new Date(log.timestamp).toISOString()
    }));
    
    res.json(formattedLogs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener registros' });
  }
});

// Start Server with Vite Middleware
async function startServer() {
  await initDB();

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
