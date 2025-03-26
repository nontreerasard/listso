const { google } = require('googleapis');
const mysql = require('mysql2/promise');

const credentials = require('./credentials.json');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'listso'
};

const spreadsheetId = '1JEUhnkbU8_8_cUDaVybYRaNyfWhH3cVQcKexW3MbNjo';
const range = 'Sheet1!A2:N';

async function importData() {
    let insertedCount = 0;
    let errorCount = 0;
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });

        const authClient = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: authClient });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log('No data found in spreadsheet.');
            return;
        }

        const connection = await mysql.createConnection(dbConfig);

        try {
            // ลบข้อมูลใน service_order_details ก่อน
           await connection.execute('DELETE FROM service_order_details');
           console.log('Table service_order_details deleted successfully.');
           // ลบข้อมูลใน service_orders
           await connection.execute('DELETE FROM service_orders');
           console.log('Table service_orders deleted successfully.');

           //รีเซ็ต AUTO_INCREMENT
            await connection.execute('ALTER TABLE service_orders AUTO_INCREMENT = 1');
            console.log('Table service_orders AUTO_INCREMENT reset successfully.');

        } catch (error) {
            console.error('Error deleting data or resetting AUTO_INCREMENT:', error);
        }

        const sql = `INSERT INTO service_orders 
            (so_file, customer_service, project, product, job_type, sale, 
             so_receive_date, start_date, end_date, process_date, so_status, 
             remark, price) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        for (let i = rows.length - 1; i >= 0; i--) {
            const row = rows[i];
            if (row.length !== 14) {
                console.warn('Invalid row length:', row);
                errorCount++;
                continue;
            }

            const values = [
                row[1] || null,  // so_file
                row[2] || null,  // customer_service
                row[3] || null,  // project
                row[4] || null,  // product
                row[5] || null,  // job_type
                row[6] || null,  // sale
                formatDate(String(row[7] || '')),  // so_receive_date
                formatDate(String(row[8] || '')),  // start_date
                formatDate(String(row[9] || '')),  // end_date
                formatDate(String(row[10] || '')), // process_date
                row[11] || null, // so_status
                row[12] || null, // remark
                row[13] ? parseFloat(String(row[13]).replace(/,/g, '')) : null // price
            ];

            try {
                await connection.execute(sql, values);
                insertedCount++;
            } catch (error) {
                console.error('Error inserting row:', row, error);
                errorCount++;
            }
        }

        console.log(`\nData import completed.`);
        console.log(`Inserted: ${insertedCount} rows`);
        console.log(`Errors: ${errorCount} rows`);
        await connection.end();

    } catch (error) {
        console.error('Error:', error);
    }
}

function formatDate(dateStr) {
    if (!dateStr || dateStr === '0000-00-00') return null;
    try {
        if (dateStr.includes('-')) {
            const [year, month, day] = dateStr.split('-');
            if (year === '0000' || month === '00' || day === '00') {
                return null;
            }
            return dateStr;
        }

        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                 if (year.length !== 4) {
                  return null; // Skip dates that do not have a 4-digit year
                }
                if (year === '0000' || month === '00' || day === '00') {
                    return null;
                }
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }

        return null;

    } catch (error) {
        console.log('Error parsing date:', dateStr, error);
        return null;
    }
}

importData();
