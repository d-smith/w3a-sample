const path = require('path');

// Get the location of database.sqlite file
const dbPath = path.resolve(__dirname, 'db/database.sqlite');

// Create connection to SQLite database
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true
});

knex.schema
    // Make sure no "users" table exists
    // before trying to create new
    .hasTable('users')
    .then((exists) => {
        if(!exists) {
            return knex.schema.createTable('users', (table)  => {
                table.string('email').primary();
                table.string('secret').notNullable();
            })
            .then(() => {
                // Log success message
                console.log('Table \'Users\' created');
            })
            .catch((error) => {
                console.error(`There was an error creating table: ${error}`);
            })
        }   
    })
    .catch((error) => {
        console.error(`There was an error setting up the database: ${error}`);
    });

knex.schema
    .hasTable('shares')
    .then((exists) => {
        if(!exists) {
            return knex.schema.createTable('shares', (table)  => {
                table.string('email').primary();
                table.string('share').notNullable();
            })
            .then(() => {
                // Log success message
                console.log('Table \'Shares\' created');
            })
            .catch((error) => {
                console.error(`There was an error creating table: ${error}`);
            })
        }
    })
    .catch((error) => {
        console.error(`There was an error setting up the database: ${error}`);
    });

module.exports = knex;

