import pool from '../config/db.js';

// GET all shipments for the logged-in user
export const getShipments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, user_id, truck, origin, destination, distance, duration, color, is_safe, visible, route_geometry, route_distance, route_duration FROM shipments WHERE user_id = ?',
      [req.user.id]
    );
    const shipments = rows.map(row => {
      let geometry = row.route_geometry;
      try { if (typeof geometry === 'string') geometry = JSON.parse(geometry); } catch {}
      return {
        id: row.id, truck: row.truck, origin: row.origin, destination: row.destination,
        distance: row.distance, duration: row.duration, color: row.color,
        isSafe: row.is_safe === 1, visible: row.visible === 1,
        route: {
          geometry, distance: row.route_distance,
          duration: row.route_duration, isSafe: row.is_safe === 1
        }
      };
    });
    res.json(shipments);
  } catch (error) {
    console.error('getShipments error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST create a new shipment for the logged-in user
export const createShipment = async (req, res) => {
  const { id, truck, origin, destination, distance, duration, color, isSafe, visible, route } = req.body;
  try {
    await pool.query(
      `INSERT INTO shipments 
        (id, user_id, truck, origin, destination, distance, duration, color, is_safe, visible, route_geometry, route_distance, route_duration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.user.id, truck, origin, destination,
        distance, duration, color,
        isSafe ? 1 : 0,
        visible ? 1 : 0,
        JSON.stringify(route.geometry),
        route.distance,
        route.duration
      ]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('createShipment error:', error);
    res.status(500).json({ error: error.message });
  }
};

// PATCH toggle visibility (scoped to owner)
export const toggleShipmentVisibility = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'UPDATE shipments SET visible = NOT visible WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('toggleShipmentVisibility error:', error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE a shipment (scoped to owner)
export const deleteShipment = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM shipments WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('deleteShipment error:', error);
    res.status(500).json({ error: error.message });
  }
};
