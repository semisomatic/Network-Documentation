import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// List all projects
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, hostname, model, fortios_version, created_at, updated_at FROM projects ORDER BY updated_at DESC'
    );
    res.json(result.rows.map(r => ({
      id: r.id,
      name: r.name,
      hostname: r.hostname,
      model: r.model,
      fortiosVersion: r.fortios_version,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })));
  } catch (err) {
    console.error('Error listing projects:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single project with full config
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const r = result.rows[0];
    res.json({
      id: r.id,
      name: r.name,
      hostname: r.hostname,
      model: r.model,
      fortiosVersion: r.fortios_version,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      config: r.config,
    });
  } catch (err) {
    console.error('Error getting project:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create project
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, hostname, model, fortiosVersion, config } = req.body;
    const result = await pool.query(
      `INSERT INTO projects (name, hostname, model, fortios_version, config)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name || 'New Project', hostname || 'FortiGate', model || 'FortiGate-60F', fortiosVersion || '7.4', JSON.stringify(config || {})]
    );
    const r = result.rows[0];
    res.status(201).json({
      id: r.id,
      name: r.name,
      hostname: r.hostname,
      model: r.model,
      fortiosVersion: r.fortios_version,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      config: r.config,
    });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update project
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, hostname, model, fortiosVersion, config } = req.body;
    const result = await pool.query(
      `UPDATE projects
       SET name = $1, hostname = $2, model = $3, fortios_version = $4, config = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, hostname, model, fortiosVersion, JSON.stringify(config), req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const r = result.rows[0];
    res.json({
      id: r.id,
      name: r.name,
      hostname: r.hostname,
      model: r.model,
      fortiosVersion: r.fortios_version,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      config: r.config,
    });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
