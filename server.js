const express = require("express")
const mysql = require("mysql2/promise")
const cors = require("cors")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const app = express()
const port = 3000;

app.use(cors())
app.use(express.json())
app.use(express.static("public"))

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'listso',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function loadData() {
  try {
    const [rows] = await pool.query('SELECT * FROM service_orders ORDER BY id DESC');
    console.log('ข้อมูลที่ได้:', rows);
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการ query:', err);
  }
}

app.get('/api/test-load-data', async (req, res) => {
  await loadData();
  res.send('Data loaded (check console)');
});

app.get("/api/so-data", async (req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM service_orders ORDER BY id DESC")
    res.json(rows)
  } catch (err) {
    console.error("Error querying database:", err)
    res.status(500).json({ error: "Database error" })
    next(err)
  }
})

const SECRET_KEY = "your-secret-key"

app.post("/api/add-entry", async (req, res) => {
  console.log("==== เริ่มบันทึกข้อมูล ====")
  console.log("ข้อมูลที่ได้รับ:", req.body)

  try {
    if (!req.body.soFile || !req.body.customerService) {
      throw new Error("กรุณากรอกข้อมูล SO/File และ Customer Service")
    }

    const query = `
            INSERT INTO service_orders (
                so_file, customer_service, project, product, 
                job_type, sale, so_receive_date, start_date,
                end_date, process_date, so_status, remark, price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `

    const values = [
      req.body.soFile,
      req.body.customerService,
      req.body.project || null,
      req.body.product || null,
      req.body.jobType || null,
      req.body.sale || null,
      req.body.soReceiveDate || null,
      req.body.startDate || null,
      req.body.endDate || null,
      req.body.processDate || null,
      req.body.soStatus || null,
      req.body.remark || null,
      req.body.price || 0,
    ]

    console.log("SQL Query:", query)
    console.log("Values:", values)

    const [result] = await pool.execute(query, values)
    console.log("ผลการบันทึก:", result)

    res.json({
      success: true,
      message: "บันทึกข้อมูลสำเร็จ",
      id: result.insertId,
    })
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error)
    res.status(500).json({
      error: true,
      message: error.message,
    })
  }
})

app.get("/api/get-all-so-file", async (req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT so_file FROM service_orders")
    const soFiles = rows.map((row) => row.so_file)
    res.json({ soFiles })
  } catch (err) {
    console.error("Error getting all SO files:", err)
    res.status(500).json({ error: "Database error" })
    next(err)
  }
})

app.get("/api/last-so-file", async (req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT MAX(so_file) AS lastId FROM service_orders")
    res.json(rows[0])
  } catch (err) {
    console.error("Error getting last SO file:", err)
    res.status(500).json({ error: "Database error" })
    next(err)
  }
})

app.post("/api/add-entry-detail", async (req, res) => {
  console.log("เพิ่มรายการย่อย:", req.body)

  try {
    if (!req.body.soMainId) {
      throw new Error("ไม่พบ ID รายการหลัก")
    }

    const result = await pool.execute(
      `
            INSERT INTO service_order_details (
                so_main_id, so_file, customer_service, project, 
                product, job_type, sale, so_receive_date, 
                start_date, end_date, process_date, so_status, 
                remark, price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      [
        req.body.soMainId,
        req.body.soFile,
        req.body.customerService,
        req.body.project,
        req.body.product,
        req.body.jobType,
        req.body.sale,
        req.body.soReceiveDate,
        req.body.startDate,
        req.body.endDate,
        req.body.processDate,
        req.body.soStatus,
        req.body.remark,
        req.body.price,
      ],
    )

    res.json({
      success: true,
      message: "บันทึกรายการย่อยสำเร็จ",
      id: result[0].insertId,
    })
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({
      error: true,
      message: error.message,
    })
  }
})

app.get("/api/so-data-detail", async (req, res) => {
  try {
    const [results] = await pool.execute("SELECT * FROM service_order_details ORDER BY id DESC")
    res.json(results)
  } catch (err) {
    console.error("Error:", err)
    res.status(500).json({
      error: "Database error",
      details: err.message,
    })
  }
})

app.get("/api/so-data-detail/:soMainId", async (req, res, next) => {
  const soMainId = req.params.soMainId
  console.log("Fetching details for soMainId:", soMainId)

  try {
    const [results] = await pool.execute("SELECT * FROM service_order_details WHERE so_main_id = ? ORDER BY id DESC", [
      soMainId,
    ])
    console.log("Found", results.length, "details")
    res.json(results)
  } catch (err) {
    console.error("Error querying database:", err)
    res.status(500).json({ error: "Database error", details: err.message })
    next(err)
  }
})

app.get("/api/so-data-detail-by-sofile/:soFile", async (req, res, next) => {
  const soFile = req.params.soFile
  console.log("Fetching details for SO/File:", soFile)

  try {
    const [results] = await pool.execute("SELECT * FROM service_order_details WHERE so_file = ? ORDER BY id DESC", [
      soFile,
    ])
    console.log("Found", results.length, "details")
    res.json(results)
  } catch (err) {
    console.error("Error querying database:", err)
    res.status(500).json({ error: "Database error", details: err.message })
    next(err)
  }
})

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body

  try {
    const [users] = await pool.execute("SELECT * FROM users WHERE username = ?", [username])

    if (users.length && (await bcrypt.compare(password, users[0].password))) {
      const token = jwt.sign({ userId: users[0].id, username: users[0].username }, SECRET_KEY, { expiresIn: "24h" })

      res.json({
        success: true,
        token,
        user: {
          id: users[0].id,
          username: users[0].username,
        },
      })
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

app.put("/api/update-entry/:id", async (req, res) => {
  try {
    const id = req.params.id

    if (!req.body.soFile || !req.body.customerService) {
      return res.status(400).json({
        error: "SO/File และ Customer Service ต้องไม่เป็นค่าว่าง",
      })
    }

    const values = [
      req.body.soFile || null,
      req.body.customerService || null,
      req.body.project || null,
      req.body.product || null,
      req.body.jobType || null,
      req.body.sale || null,
      req.body.soReceiveDate || null,
      req.body.startDate || null,
      req.body.endDate || null,
      req.body.processDate || null,
      req.body.soStatus || null,
      req.body.remark || null,
      Number.parseFloat(req.body.price) || 0,
      id,
    ]

    console.log("Values to update:", values)

    console.log("Checking if entry exists with ID:", id)
    const [checkExists] = await pool.execute("SELECT id FROM service_orders WHERE id = ?", [id])
    console.log("Check result:", checkExists)

    if (checkExists.length === 0) {
      return res.status(404).json({
        error: "ไม่พบรายการที่ต้องการแก้ไข",
        id: id,
      })
    }

    const query = `
            UPDATE service_orders 
            SET so_file = ?, 
                customer_service = ?, 
                project = ?, 
                product = ?, 
                job_type = ?, 
                sale = ?, 
                so_receive_date = ?,
                start_date = ?, 
                end_date = ?, 
                process_date = ?,
                so_status = ?, 
                remark = ?, 
                price = ?
            WHERE id = ?
        `

    const [result] = await pool.execute(query, values)

    if (result.affectedRows === 0) {
      throw new Error("ไม่สามารถอัพเดทข้อมูลได้")
    }

    res.json({
      success: true,
      message: "อัพเดทข้อมูลสำเร็จ",
      affectedRows: result.affectedRows,
    })
  } catch (error) {
    console.error("Update error details:", {
      id: id,
      requestBody: req.body,
    })
    res.status(500).json({
      error: "Failed to update entry",
      details: error.message,
      sqlMessage: error.sqlMessage,
    })
  }
})

app.delete("/api/delete-entry/:id", async (req, res) => {
  try {
    const id = req.params.id

    const [checkExists] = await pool.execute("SELECT id, so_file FROM service_orders WHERE id = ?", [id])

    if (checkExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบรายการที่ต้องการลบ",
      })
    }

    const [result] = await pool.execute("DELETE FROM service_orders WHERE id = ?", [id])

    res.json({
      success: true,
      message: "ลบรายการหลักเรียบร้อยแล้ว",
    })
  } catch (error) {
    console.error("Delete error:", error)
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบข้อมูล",
    })
  }
})

app.delete("/api/delete-detail/:id", async (req, res) => {
  try {
    const id = req.params.id

    const [checkExists] = await pool.execute("SELECT id FROM service_order_details WHERE id = ?", [id])

    if (checkExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบรายการที่ต้องการลบ",
      })
    }

    const [result] = await pool.execute("DELETE FROM service_order_details WHERE id = ?", [id])

    res.json({
      success: true,
      message: "ลบรายการย่อยเรียบร้อยแล้ว",
    })
  } catch (error) {
    console.error("Delete error:", error)
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบข้อมูล",
    })
  }
})

app.put("/api/update-detail/:id", async (req, res) => {
  try {
    const id = req.params.id

    const [checkExists] = await pool.execute("SELECT id FROM service_order_details WHERE id = ?", [id])

    if (checkExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบรายการที่ต้องการแก้ไข",
      })
    }

    const query = `
            UPDATE service_order_details 
            SET so_file = ?, 
                customer_service = ?, 
                project = ?, 
                product = ?, 
                job_type = ?, 
                sale = ?, 
                so_receive_date = ?,
                start_date = ?, 
                end_date = ?, 
                process_date = ?,
                so_status = ?, 
                remark = ?, 
                price = ?
            WHERE id = ?
        `

    const values = [
      req.body.soFile || null,
      req.body.customerService || null,
      req.body.project || null,
      req.body.product || null,
      req.body.jobType || null,
      req.body.sale || null,
      req.body.soReceiveDate || null,
      req.body.startDate || null,
      req.body.endDate || null,
      req.body.processDate || null,
      req.body.soStatus || null,
      req.body.remark || null,
      Number.parseFloat(req.body.price) || 0,
      id,
    ]

    const [result] = await pool.execute(query, values)

    res.json({
      success: true,
      message: "อัพเดทข้อมูลสำเร็จ",
      affectedRows: result.affectedRows,
    })
  } catch (error) {
    console.error("Update error:", error)
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัพเดทข้อมูล",
      details: error.message,
    })
  }
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

