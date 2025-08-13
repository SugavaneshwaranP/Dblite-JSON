const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

// Open database
const db = new sqlite3.Database('survey.db');

// Create table
const createTableQuery = `
CREATE TABLE users (
    user_id INTEGER,
    name TEXT,
    email TEXT,
    password TEXT,
    Age INTEGER,
    Gender TEXT,
    Marital_Status TEXT,
    Occupation TEXT,
    Monthly_Income TEXT,
    Educational_Qualifications TEXT,
    Family_size INTEGER
)
`;

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS users", (err) => {
        if (err) {
            console.error("Error dropping table:", err.message);
            return;
        }

        db.run(createTableQuery, (err) => {
            if (err) {
                console.error("Error creating table:", err.message);
                return;
            }

            console.log("Table created successfully.");

            let rows = [];
            fs.createReadStream('users.csv')
                .pipe(csv())
                .on('data', (row) => {
                    // Normalize keys (trim spaces)
                    const cleanRow = {};
                    for (let key in row) {
                        cleanRow[key.trim()] = row[key].trim();
                    }
                    rows.push(cleanRow);
                })
                .on('end', () => {
                    console.log(`CSV read complete. Found ${rows.length} rows.`);
                    console.log("First row:", rows[0]); // Debug mapping

                    db.serialize(() => {
                        const insertStmt = db.prepare(`
                            INSERT INTO users (
                                user_id, name, email, password, Age, Gender,
                                Marital_Status, Occupation, Monthly_Income,
                                Educational_Qualifications, Family_size
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `);

                        rows.forEach(r => {
                            insertStmt.run([
                                r.user_id,
                                r.name,
                                r.email,
                                r.password,
                                r.Age,
                                r.Gender,
                                r["Marital Status"],
                                r.Occupation,
                                r["Monthly Income"],
                                r["Educational Qualifications"],
                                r["Family size"]
                            ]);
                        });

                        insertStmt.finalize(() => {
                            console.log("All rows inserted successfully.");
                            db.close();
                        });
                    });
                });
        });
    });
});
