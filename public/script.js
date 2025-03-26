const ITEMS_PER_PAGE = 50
let currentPage = 1
let allData = []
let addEntryForm
let activeModal = null
let previousModal = null
let mainSoFile = ""
let soFileField
let currentDetailMainId = null

async function loadDataFromAPI() {
  try {
    console.log("กำลังโหลดข้อมูล...")
    const response = await fetch("/api/so-data")

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("ข้อมูลที่ได้:", data)

    if (!Array.isArray(data)) {
      throw new Error("ข้อมูลที่ได้ไม่ใช่ array")
    }

    allData = data
    return allData
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error)
    alert(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}`)
    return []
  }
}

function displayDataInTable(data) {
  if (!Array.isArray(data)) {
    console.error("Data is not an array:", data)
    return
  }

  const tableBody = document.getElementById("mysqlData")
  tableBody.innerHTML = ""

  if (data.length === 0) {
    console.log("No data to display")
    return
  }

  const start = (currentPage - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  const pageData = data.slice(start, end)

  const fragment = document.createDocumentFragment()

  pageData.forEach((row) => {
    const tr = createTableRow(row)
    fragment.appendChild(tr)
  })

  tableBody.appendChild(fragment)
  updatePagination(data.length)
}

function createTableRow(data) {
  const row = document.createElement("tr")
  row.setAttribute("data-id", data.id || "")

  const idCell = document.createElement("td")
  idCell.textContent = data.id || ""
  row.appendChild(idCell)

  const actionsCell = document.createElement("td")
  actionsCell.className = "actions-cell"

  const detailsBtn = document.createElement("button")
  detailsBtn.textContent = "Details"
  detailsBtn.className = "btn btn-info btn-sm details-btn"
  detailsBtn.onclick = () => {
    showDetails(data.id)
  }
  actionsCell.appendChild(detailsBtn)

  const editBtn = document.createElement("button")
  editBtn.textContent = "Edit"
  editBtn.className = "btn btn-warning btn-sm edit-btn"
  editBtn.onclick = () => {
    showEditForm(data)
  }
  actionsCell.appendChild(editBtn)

  const deleteBtn = document.createElement("button")
  deleteBtn.textContent = "Delete"
  deleteBtn.className = "btn btn-danger btn-sm delete-btn"
  deleteBtn.onclick = () => {
    deleteMainEntry(data.id)
  }
  actionsCell.appendChild(deleteBtn)

  row.appendChild(actionsCell)

  appendCell(row, data.so_file || "")
  appendCell(row, data.customer_service || "")
  appendCell(row, data.project || "")
  appendCell(row, data.product || "")
  appendCell(row, data.job_type || "")
  appendCell(row, data.sale || "")
  appendCell(row, formatDate(data.so_receive_date))
  appendCell(row, formatDate(data.start_date))
  appendCell(row, formatDate(data.end_date))
  appendCell(row, formatDate(data.process_date))

  const statusCell = document.createElement("td")
  statusCell.textContent = data.so_status || ""
  if (data.so_status) {
    const statusClass = getStatusClass(data.so_status)
    if (statusClass && statusClass.length > 0) {
      statusCell.classList.add(statusClass)
    }
  }
  row.appendChild(statusCell)

  appendCell(row, data.remark || "")
  appendCell(row, formatPrice(data.price))

  return row
}

function getStatusClass(status) {
  if (!status) return ""

  status = status.toLowerCase().trim()
  switch (status) {
    case "processing":
      return "status-processing"
    case "in processing":
      return "status-processing"
    case "completed":
      return "status-complete"
    case "pending":
      return "status-pending"
    case "renew":
      return "status-renew"
    case "new":
      return "status-new"
    case "cancel":
      return "status-cancelled"
    default:
      return ""
  }
}

function formatDate(dateString) {
  if (!dateString || dateString === "0000-00-00") return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

function formatPrice(price) {
  return price
    ? price.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : ""
}

function appendCell(tr, text) {
  const td = document.createElement("td")
  td.textContent = text
  tr.appendChild(td)
}

function updatePagination(totalItems) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const pagination = document.getElementById("pagination")
  pagination.innerHTML = ""

  const prevButton = document.createElement("button")
  prevButton.textContent = "Previous"
  prevButton.disabled = currentPage === 1
  prevButton.onclick = () => changePage(currentPage - 1)
  pagination.appendChild(prevButton)

  const pageInfo = document.createElement("span")
  pageInfo.textContent = ` Page ${currentPage} of ${totalPages} `
  pagination.appendChild(pageInfo)

  const nextButton = document.createElement("button")
  nextButton.textContent = "Next"
  nextButton.disabled = currentPage === totalPages
  nextButton.onclick = () => changePage(currentPage + 1)
  pagination.appendChild(nextButton)
}

function changePage(newPage) {
  currentPage = newPage
  displayDataInTable(allData)
}

function debounce(func, wait) {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

function showEditDetailForm(data) {
    const editModal = document.getElementById("editModal")
  
    document.getElementById("editSoFile").value = data.so_file || ""
    document.getElementById("editSoFile").disabled = false
    document.getElementById("editCustomerService").value = data.customer_service || ""
    document.getElementById("editProject").value = data.project || ""
    document.getElementById("editProduct").value = data.product || ""
    document.getElementById("editJobType").value = data.job_type || ""
    document.getElementById("editSale").value = data.sale || ""
    document.getElementById("editSoReceiveDate").value = data.so_receive_date ? data.so_receive_date.split("T")[0] : ""
    document.getElementById("editStartDate").value = data.start_date ? data.start_date.split("T")[0] : ""
    document.getElementById("editEndDate").value = data.end_date ? data.end_date.split("T")[0] : ""
    document.getElementById("editProcessDate").value = data.process_date ? data.process_date.split("T")[0] : ""
    document.getElementById("editSoStatus").value = data.so_status || ""
    document.getElementById("editRemark").value = data.remark || ""
    document.getElementById("editPrice").value = data.price || ""
  
    editModal.dataset.editId = data.id
    editModal.dataset.isDetail = "true"
  
    editModal.style.display = "block"
    previousModal = activeModal
    activeModal = editModal
  }

  function showEditForm(data) {
    const editModal = document.getElementById("editModal")
  
    document.getElementById("editSoFile").value = data.so_file || ""
    document.getElementById("editSoFile").disabled = false
    document.getElementById("editCustomerService").value = data.customer_service || ""
    document.getElementById("editProject").value = data.project || ""
    document.getElementById("editProduct").value = data.product || ""
    document.getElementById("editJobType").value = data.job_type || ""
    document.getElementById("editSale").value = data.sale || ""
    document.getElementById("editSoReceiveDate").value = data.so_receive_date ? data.so_receive_date.split("T")[0] : ""
    document.getElementById("editStartDate").value = data.start_date ? data.start_date.split("T")[0] : ""
    document.getElementById("editEndDate").value = data.end_date ? data.end_date.split("T")[0] : ""
    document.getElementById("editProcessDate").value = data.process_date ? data.process_date.split("T")[0] : ""
    document.getElementById("editSoStatus").value = data.so_status || ""
    document.getElementById("editRemark").value = data.remark || ""
    document.getElementById("editPrice").value = data.price || ""
  
    editModal.dataset.editId = data.id
    editModal.dataset.isDetail = "false"
  
    editModal.style.display = "block"
    previousModal = activeModal
    activeModal = editModal
  }

const searchTable = debounce(async () => {
  const mainInput = document.getElementById("searchMain").value.toUpperCase()
  const detailInput = document.getElementById("searchDetails").value.toUpperCase()

  try {
    let filteredData = allData.filter((mainRow) => {
      const mainMatch = Object.values(mainRow).some((value) => String(value).toUpperCase().includes(mainInput))
      return mainMatch
    })

    if (detailInput) {
      try {
        const detailResponse = await fetch("/api/so-data-detail")
        if (!detailResponse.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูลรายการย่อยได้")
        }
        const detailData = await detailResponse.json()

        filteredData = filteredData.filter((mainRow) => {
          const matchingDetails = detailData.filter(
            (detailRow) =>
              detailRow.so_file === mainRow.so_file &&
              Object.values(detailRow).some((value) => String(value).toUpperCase().includes(detailInput)),
          )
          return matchingDetails.length > 0
        })
      } catch (error) {
        console.error("Error fetching detail data:", error)
      }
    }

    currentPage = 1
    displayDataInTable(filteredData)
  } catch (error) {
    console.error("Error searching:", error)
  }
}, 300)

function searchInDetails() {
  const searchText = document.getElementById("searchDetails").value.toLowerCase()
  const detailsTable = document.querySelector("#addedEntriesTable tbody")
  if (!detailsTable) return

  const rows = detailsTable.getElementsByTagName("tr")

  for (const row of rows) {
    let text = ""
    const cells = row.getElementsByTagName("td")

    for (const cell of cells) {
      text += cell.textContent + " "
    }

    text = text.toLowerCase()

    if (text.includes(searchText)) {
      row.style.display = ""
    } else {
      row.style.display = "none"
    }
  }
}

async function showDetails(id) {
  currentDetailMainId = id
  const detailsModal = document.getElementById("detailsModal")
  const modalDetails = document.getElementById("modalDetails")
  modalDetails.innerHTML = ""

  try {
    const response = await fetch(`/api/so-data`)
    const data = await response.json()
    const rowData = data.find((item) => item.id === id)

    if (rowData) {
      mainSoFile = rowData.so_file
      let detailsHTML = ""

      detailsHTML += `
                <table class="details-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>SO/File</th>
                            <th>Customer Service</th>
                            <th>Project</th>
                            <th>Product</th>
                            <th>Job Type</th>
                            <th>Sale</th>
                            <th>SO Receive Date</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Process Date</th>
                            <th>SO Status</th>
                            <th>Remark</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${rowData.id || ""}</td>
                            <td>${rowData.so_file || ""}</td>
                            <td>${rowData.customer_service || ""}</td>
                            <td>${rowData.project || ""}</td>
                            <td>${rowData.product || ""}</td>
                            <td>${rowData.job_type || ""}</td>
                            <td>${rowData.sale || ""}</td>
                            <td>${formatDate(rowData.so_receive_date)}</td>
                            <td>${formatDate(rowData.start_date)}</td>
                            <td>${formatDate(rowData.end_date)}</td>
                            <td>${formatDate(rowData.process_date)}</td>
                            <td>${rowData.so_status || ""}</td>
                            <td>${rowData.remark || ""}</td>
                            <td>${formatPrice(rowData.price)}</td>
                        </tr>
                    </tbody>
                </table>
            `
      modalDetails.innerHTML += detailsHTML

      detailsModal.style.display = "block"
      activeModal = detailsModal
      previousModal = null

      const addDetailTitle = document.createElement("h3")
      addDetailTitle.textContent = "รายการเพิ่มเติม"
      modalDetails.appendChild(addDetailTitle)

      let table = document.getElementById("addedEntriesTable")
      if (!table) {
        table = document.createElement("table")
        table.id = "addedEntriesTable"
        table.style.width = "100%"
        table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Actions</th>
                            <th>SO/File</th>
                            <th>Customer Service</th>
                            <th>Project</th>
                            <th>Product</th>
                            <th>Job Type</th>
                            <th>Sale</th>
                            <th>SO Receive Date</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Process Date</th>
                            <th>SO Status</th>
                            <th>Remark</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `
        modalDetails.appendChild(table)
      }

      const addDetailButton = document.createElement("button")
      addDetailButton.textContent = "เพิ่มรายการย่อย"
      addDetailButton.onclick = () => {
        const addEntryModal = document.getElementById("addEntryModal")
        const modalTitle = document.getElementById("modalTitle")
        soFileField = document.getElementById("soFile")

        modalTitle.textContent = "เพิ่มรายการย่อย"

        soFileField.value = mainSoFile
        soFileField.disabled = true
        addEntryModal.style.display = "block"
        previousModal = detailsModal
        activeModal = addEntryModal
      }
      modalDetails.appendChild(addDetailButton)

      try {
        const detailResponse = await fetch(`/api/so-data-detail-by-sofile/${mainSoFile}`)
        if (!detailResponse.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูลรายการย่อยได้")
        }
        const detailData = await detailResponse.json()

        const tableBody = document.querySelector("#addedEntriesTable tbody")
        if (detailData.length > 0) {
          tableBody.innerHTML = ""
          detailData.forEach((entry) => {
            const row = tableBody.insertRow()

            const actionsCell = document.createElement("td")

            const editBtn = document.createElement("button")
            editBtn.textContent = "Edit"
            editBtn.className = "btn btn-warning btn-sm"
            editBtn.onclick = () => showEditDetailForm(entry)
            actionsCell.appendChild(editBtn)

            const deleteBtn = document.createElement("button")
            deleteBtn.textContent = "Delete"
            deleteBtn.className = "btn btn-danger btn-sm"
            deleteBtn.onclick = () => deleteDetailEntry(entry.id)
            actionsCell.appendChild(deleteBtn)

            row.appendChild(actionsCell)

            appendCell(row, entry.so_file || "")
            appendCell(row, entry.customer_service || "")
            appendCell(row, entry.project || "")
            appendCell(row, entry.product || "")
            appendCell(row, entry.job_type || "")
            appendCell(row, entry.sale || "")
            appendCell(row, formatDate(entry.so_receive_date))
            appendCell(row, formatDate(entry.start_date))
            appendCell(row, formatDate(entry.end_date))
            appendCell(row, formatDate(entry.process_date))
            const statusCell = document.createElement("td")
            statusCell.textContent = entry.so_status || ""
            if (entry.so_status) {
              const statusClass = getStatusClass(entry.so_status)
              if (statusClass) statusCell.classList.add(statusClass)
            }
            row.appendChild(statusCell)
            appendCell(row, entry.remark || "")
            appendCell(row, formatPrice(entry.price))
          })
        } else {
          tableBody.innerHTML = `
                        <tr>
                            <td colspan="13" style="text-align: center">ไม่มีรายการเพิ่มเติม</td>
                        </tr>
                    `
        }
      } catch (error) {
        console.error("Error loading details:", error)
      }
    }
  } catch (error) {
    console.error("Error:", error)
  }
}

async function loadAddedEntries(id) {
  try {
    console.log("Loading added entries for ID:", id)
    const response = await fetch(`/api/so-data-detail/${id}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Loaded entries:", data)

    const tableBody = document.querySelector("#addedEntriesTable tbody")
    if (!tableBody) {
      console.error("Table body not found!")
      return
    }

    tableBody.innerHTML = ""

    if (data.length === 0) {
      console.log("No added entries found")
      const emptyRow = tableBody.insertRow()
      const cell = emptyRow.insertCell()
      cell.colSpan = 13
      cell.textContent = "ไม่มีรายการเพิ่มเติม"
      cell.style.textAlign = "center"
      return
    }

    data.forEach((entry) => {
      const row = tableBody.insertRow()

      const actionsCell = document.createElement("td")

      const editBtn = document.createElement("button")
      editBtn.textContent = "Edit"
      editBtn.className = "btn btn-warning btn-sm"
      editBtn.onclick = () => showEditDetailForm(entry)
      actionsCell.appendChild(editBtn)

      const deleteBtn = document.createElement("button")
      deleteBtn.textContent = "Delete"
      deleteBtn.className = "btn btn-danger btn-sm"
      deleteBtn.onclick = () => deleteDetailEntry(entry.id)
      actionsCell.appendChild(deleteBtn)

      row.appendChild(actionsCell)

      appendCell(row, entry.so_file || "")
      appendCell(row, entry.customer_service || "")
      appendCell(row, entry.project || "")
      appendCell(row, entry.product || "")
      appendCell(row, entry.job_type || "")
      appendCell(row, entry.sale || "")
      appendCell(row, formatDate(entry.so_receive_date))
      appendCell(row, formatDate(entry.start_date))
      appendCell(row, formatDate(entry.end_date))
      appendCell(row, formatDate(entry.process_date))
      const statusCell = document.createElement("td")
      statusCell.textContent = entry.so_status || ""
      if (entry.so_status) {
        const statusClass = getStatusClass(entry.so_status)
        if (statusClass && statusClass.length > 0) {
          statusCell.classList.add(statusClass)
        }
      }
      row.appendChild(statusCell)
      appendCell(row, entry.remark || "")
      appendCell(row, formatPrice(entry.price))
    })
  } catch (error) {
    console.error("Error loading added entries:", error)
  }
}

async function getLastSoFile() {
  try {
    console.log("getLastSoFile: getting last so file")
    const response = await fetch("/api/last-so-file")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    console.log("getLastSoFile: get last so file complete, data: ", data)

    if (data.lastSoFile) {
      const lastSoNumber = Number.parseInt(data.lastSoFile.replace(/\D/g, ""))
      return `SO${lastSoNumber + 1}`
    } else {
      return `SO1`
    }
  } catch (error) {
    console.error("Error:", error)
    return `SO1`
  }
}

async function deleteMainEntry(id) {
  try {
    const response = await fetch(`/api/so-data`)
    const data = await response.json()
    const rowToDelete = data.find((item) => item.id === id)

    if (!rowToDelete) {
      throw new Error("ไม่พบรายการที่ต้องการลบ")
    }

    const soFileToDelete = rowToDelete.so_file

    if (!confirm("คุณต้องการลบรายการหลักนี้หรือไม่?\nรายการย่อยที่เกี่ยวข้องจะไม่ถูกลบ")) {
      return
    }

    const deleteResponse = await fetch(`/api/delete-entry/${id}`, {
      method: "DELETE",
    })

    if (!deleteResponse.ok) {
      throw new Error(`HTTP error! status: ${deleteResponse.status}`)
    }

    const result = await deleteResponse.json()

    if (result.success) {
      alert("ลบรายการหลักเรียบร้อยแล้ว")
      const newData = await loadDataFromAPI()
      displayDataInTable(newData)
    } else {
      throw new Error(result.message || "ไม่สามารถลบรายการได้")
    }
  } catch (error) {
    console.error("Error deleting entry:", error)
    alert(`เกิดข้อผิดพลาดในการลบรายการ: ${error.message}`)
  }
}

async function loadEntriesBySOFile(soFile) {
  try {
    console.log("Loading detail entries for SO/File:", soFile)
    const response = await fetch(`/api/so-data-detail-by-sofile/${soFile}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Loaded entries:", data)

    const tableBody = document.querySelector("#addedEntriesTable tbody")
    if (!tableBody) {
      console.error("Table body not found!")
      return
    }

    tableBody.innerHTML = ""

    if (data.length === 0) {
      console.log("No detail entries found")
      const emptyRow = tableBody.insertRow()
      const cell = emptyRow.insertCell()
      cell.colSpan = 13
      cell.textContent = "ไม่มีรายการเพิ่มเติม"
      cell.style.textAlign = "center"
      return
    }

    data.forEach((entry) => {
      const row = tableBody.insertRow()

      const actionsCell = document.createElement("td")

      const editBtn = document.createElement("button")
      editBtn.textContent = "Edit"
      editBtn.className = "btn btn-warning btn-sm"
      editBtn.onclick = () => showEditDetailForm(entry)
      actionsCell.appendChild(editBtn)

      const deleteBtn = document.createElement("button")
      deleteBtn.textContent = "Delete"
      deleteBtn.className = "btn btn-danger btn-sm"
      deleteBtn.onclick = () => deleteDetailEntry(entry.id)
      actionsCell.appendChild(deleteBtn)

      row.appendChild(actionsCell)

      appendCell(row, entry.so_file || "")
      appendCell(row, entry.customer_service || "")
      appendCell(row, entry.project || "")
      appendCell(row, entry.product || "")
      appendCell(row, entry.job_type || "")
      appendCell(row, entry.sale || "")
      appendCell(row, formatDate(entry.so_receive_date))
      appendCell(row, formatDate(entry.start_date))
      appendCell(row, formatDate(entry.end_date))
      appendCell(row, formatDate(entry.process_date))
      const statusCell = document.createElement("td")
      statusCell.textContent = entry.so_status || ""
      if (entry.so_status) {
        const statusClass = getStatusClass(entry.so_status)
        if (statusClass && statusClass.length > 0) {
          statusCell.classList.add(statusClass)
        }
      }
      row.appendChild(statusCell)
      appendCell(row, entry.remark || "")
      appendCell(row, formatPrice(entry.price))
    })
  } catch (error) {
    console.error("Error loading detail entries:", error)
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadDataFromAPI()
  displayDataInTable(data)

  document.getElementById("searchMain").addEventListener("keyup", searchTable)
  document.getElementById("searchDetails").addEventListener("keyup", searchTable)

  addEntryForm = document.getElementById("addEntryForm")
  const editEntryForm = document.getElementById("editEntryForm")
  const addEntryModal = document.getElementById("addEntryModal")
  const detailsModal = document.getElementById("detailsModal")
  soFileField = document.getElementById("soFile")

  if (addEntryForm) {
    addEntryForm.addEventListener("submit", async (event) => {
      event.preventDefault()
      console.log("กำลังส่งฟอร์ม...")

      try {
        const formData = {
          soFile: document.getElementById("soFile").value.trim(),
          customerService: document.getElementById("customerService").value.trim(),
          project: document.getElementById("project").value.trim(),
          product: document.getElementById("product").value.trim(),
          jobType: document.getElementById("jobType").value.trim(),
          sale: document.getElementById("sale").value.trim(),
          soReceiveDate: document.getElementById("soReceiveDate").value,
          startDate: document.getElementById("startDate").value,
          endDate: document.getElementById("endDate").value,
          processDate: document.getElementById("processDate").value,
          soStatus: document.getElementById("soStatus").value.trim(),
          remark: document.getElementById("remark").value.trim(),
          price: Number.parseFloat(document.getElementById("price").value) || 0,
        }

        if (currentDetailMainId) {
          formData.soMainId = currentDetailMainId
          formData.soFile = mainSoFile
        }

        const endpoint = currentDetailMainId
          ? "http://localhost:3000/api/add-entry-detail"
          : "http://localhost:3000/api/add-entry"

        console.log("ส่งข้อมูลไปที่:", endpoint)
        console.log("ข้อมูลที่ส่ง:", formData)

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        const responseText = await response.text()
        console.log("การตอบกลับจาก Server:", responseText)

        if (!response.ok) {
          throw new Error(`บันทึกไม่สำเร็จ: ${response.status} - ${responseText}`)
        }

        if (currentDetailMainId) {
          await loadAddedEntries(currentDetailMainId)
        } else {
          const newData = await loadDataFromAPI()
          displayDataInTable(newData)
        }

        addEntryForm.reset()
        addEntryModal.style.display = "none"

        alert("บันทึกข้อมูลเรียบร้อยแล้ว")
      } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error)
        alert(`เกิดข้อผิดพลาดในการบันทึก: ${error.message}`)
      }
    })
  }

  if (editEntryForm) {
    const newEditEntryForm = editEntryForm.cloneNode(true)
    editEntryForm.parentNode.replaceChild(newEditEntryForm, editEntryForm)
    newEditEntryForm.addEventListener("submit", handleFormSubmit)
  }

  document.querySelectorAll(".close").forEach((closeBtn) => {
    closeBtn.onclick = function () {
      const modal = this.closest(".modal")
      if (modal) {
        modal.style.display = "none"
        if (modal.id === "addEntryModal" && previousModal) {
          activeModal = previousModal
          previousModal = null
        } else if (modal.id === "detailsModal") {
          activeModal = null
          previousModal = null
        }
      }
    }
  })

  const editModal = document.getElementById("editModal")
  const editModalCloseBtn = editModal?.querySelector(".close")
  if (editModalCloseBtn) {
    editModalCloseBtn.onclick = () => {
      editModal.style.display = "none"
      if (previousModal) {
        activeModal = previousModal
        previousModal = null
      }
    }
  }

  document.getElementById("addData")?.addEventListener("click", () => {
    currentDetailMainId = null
    mainSoFile = ""
    soFileField.value = ""
    soFileField.disabled = false
    addEntryModal.style.display = "block"
    document.getElementById("modalTitle").textContent = "เพิ่มรายการหลัก"
  })
})

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const addEntryModal = document.getElementById("addEntryModal")
      const detailsModal = document.getElementById("detailsModal")
      const editModal = document.getElementById("editModal")
  
      if (editModal?.style.display === "block") {
        editModal.style.display = "none"
        if (previousModal) {
          activeModal = previousModal
          previousModal = null
        }
      } else if (addEntryModal?.style.display === "block") {
        addEntryModal.style.display = "none"
        if (previousModal) {
          activeModal = previousModal
          previousModal = null
        }
      } else if (detailsModal?.style.display === "block") {
        detailsModal.style.display = "none"
        activeModal = null
        previousModal = null
      }
    }
  })

function addDetailEntry(mainId, soFile) {
  const addEntryModal = document.getElementById("addEntryModal")
  const soFileField = document.getElementById("soFile")
  const detailsModal = document.getElementById("detailsModal")

  currentDetailMainId = mainId
  mainSoFile = soFile
  soFileField.value = soFile
  soFileField.disabled = true

  addEntryModal.style.display = "block"
  document.getElementById("modalTitle").textContent = "เพิ่มรายการย่อย"
  previousModal = detailsModal
  activeModal = addEntryModal
}

async function deleteDetailEntry(id) {
  if (!confirm("ต้องการลบรายการย่อยนี้หรือไม่?")) {
    return
  }

  try {
    const response = await fetch(`/api/delete-detail/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      await loadEntriesBySOFile(mainSoFile)
      alert("ลบรายการย่อยเรียบร้อยแล้ว")
    } else {
      throw new Error(result.message || "ไม่สามารถลบรายการได้")
    }
  } catch (error) {
    console.error("Error:", error)
    alert(`เกิดข้อผิดพลาดในการลบรายการ: ${error.message}`)
  }
}

async function handleFormSubmit(event) {
    event.preventDefault()
    const editModal = document.getElementById("editModal")
    const id = editModal.dataset.editId
    const isDetail = editModal.dataset.isDetail === "true"
  
    const soFile = document.getElementById("editSoFile").value.trim()
    const customerService = document.getElementById("editCustomerService").value.trim()
  
    if (!soFile || !customerService) {
      alert("กรุณากรอก SO/File และ Customer Service")
      return
    }
  
    if (!confirm("ต้องการบันทึกการเปลี่ยนแปลงหรือไม่?")) {
      return
    }
  
    try {
      const formData = {
        soFile,
        customerService,
        project: document.getElementById("editProject").value.trim(),
        product: document.getElementById("editProduct").value.trim(),
        jobType: document.getElementById("editJobType").value.trim(),
        sale: document.getElementById("editSale").value.trim(),
        soReceiveDate: document.getElementById("editSoReceiveDate").value,
        startDate: document.getElementById("editStartDate").value,
        endDate: document.getElementById("editEndDate").value,
        processDate: document.getElementById("editProcessDate").value,
        soStatus: document.getElementById("editSoStatus").value.trim(),
        remark: document.getElementById("editRemark").value.trim(),
        price: Number.parseFloat(document.getElementById("editPrice").value) || 0,
      }
  
      const endpoint = isDetail ? `/api/update-detail/${id}` : `/api/update-entry/${id}`
      console.log("Sending update to:", endpoint)
      console.log("Form data:", formData)
  
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "เกิดข้อผิดพลาดในการอัพเดทข้อมูล")
      }
  
      const result = await response.json()
  
      if (result.success) {
        alert(isDetail ? "อัพเดทรายการย่อยสำเร็จ" : "อัพเดทรายการหลักสำเร็จ")
        if (isDetail) {
          await loadEntriesBySOFile(formData.soFile)
        } else {
          const newData = await loadDataFromAPI()
          displayDataInTable(newData)
        }
        editModal.style.display = "none"
        if (previousModal) {
          activeModal = previousModal
          previousModal = null
        }
      }
    } catch (error) {
      console.error("Error updating entry:", error)
      alert(`เกิดข้อผิดพลาดในการอัพเดทข้อมูล: ${error.message}`)
    }
  }

