const express = require('express');
const cors = require('cors');
const pg = require('pg')
const { Pool, Client } = pg;
const app = express();
const PORT = 3001;
const path = require('path');
const fs = require('fs');


app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'sport-database',
  password: 'sport-database',
  host: 'localhost',
  port: 5432,
  database: 'sport-database',
})

app.post('/api/stadiums/coords', async (req, res) => {
  const matchIds = req.body.matchIds;

  if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid matchIds' });
  }

   const ids = matchIds.map(Number);

  try {
    const result = await pool.query(`
      SELECT 
        games.id AS game_id,
        stadiums.name AS stade,
        stadiums.place
      FROM game.games
      JOIN game.stadiums ON games.fk_stadiums = stadiums.id
      WHERE games.id = ANY($1::int[]);
    `, [ids]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Query failed' });
  }
});

app.get('/api/matchs/dates', async (req, res) => {
  const { startDate, endDate} = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate et endDate est requis dans les query params' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  try {
    var return_object = [];
    const result = await pool.query(`
      SELECT
        games.date AS date,
        stadiums.name AS stade,
        sport.name AS sport,
        games.competition AS competition,
        games.id AS game_id
      FROM game.games AS games
      INNER JOIN game.stadiums AS stadiums ON games.fk_stadiums = stadiums.id
      INNER JOIN game.sports AS sport ON games.fk_sports = sport.id
      WHERE games.date BETWEEN $1 AND $2;`, [startDate, endDate]);

    for (const element of result.rows) {
      const equipes = await pool.query(`
        select game.teams.name as name
        FROM game.teams
        inner join game.games_teams
        on fk_teams = game.teams.id
        where fk_games = $1`, [element.game_id]);
      return_object.push({
        id: element.game_id,
        date: element.date,
        stade: element.stade,
        sport: element.sport,
        competition: element.competition,
        teams: [...equipes.rows]
      });
    }

    res.json(return_object);
  } catch (err) {
    console.error('Erreur lors de la requête PostgreSQL :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/stadiums', async (req, res) => {

  try {
    const result = await pool.query(`
      SELECT
        stadiums.name AS stade,
        stadiums.place AS place,
        stadiums.id AS id,
        stadiums.single AS single
      FROM game.stadiums AS stadiums
      `);

    res.json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la requête PostgreSQL :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur Express démarré sur http://localhost:${PORT}`);
});

app.post('/api/sports/games', async (req, res) => {

 const matchIds = req.body.matchIds;

  if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid matchIds' });
  }

   const ids = matchIds.map(Number);

  try {
    const result = await pool.query(`
      SELECT 
        games.id AS game_id,
        sports.name AS sport,
        sports.option AS option,
        sports.id AS id
      FROM game.games
      JOIN game.sports ON games.fk_sports = sports.id
      WHERE games.id = ANY($1::int[]);
    `, [ids]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Query failed' });
  }
});
