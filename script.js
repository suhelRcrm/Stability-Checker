let allRows = [];

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, match => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[match]);
}

function updateFileLabel(inputId, labelId) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  if (input.files.length > 0) {
    label.innerHTML = `<b>${input.files[0].name}</b>`;
  }
}

function processFiles() {
  const htmlInput = document.getElementById('htmlFile').files[0];
  const csvInput = document.getElementById('csvFile').files[0];

  if (!htmlInput || !csvInput) {
    alert('Please upload both HTML and CSV files.');
    return;
  }

  const htmlReader = new FileReader();
  const csvReader = new FileReader();

  htmlReader.onload = () => {
    const htmlContent = htmlReader.result;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    const results = [];
    doc.querySelectorAll('li.test-item').forEach(item => {
      const nameEl = item.querySelector('p.name');
      const name = nameEl ? nameEl.textContent.trim() : 'Unknown';
      const status = item.getAttribute('status')?.trim().toLowerCase() || 'unknown';
      results.push({ name, status });
    });

    csvReader.onload = () => {
      const csvText = csvReader.result;
      const lines = csvText.trim().split(/\r?\n/);
      const headers = lines[0].split(',').map(h => h.trim());

      const nameIndex = headers.indexOf("Test Case");
      const traineeIndex = headers.indexOf("Converted by :");
      const templateStatusIndex = headers.indexOf("STATUS");

      const traineeSet = new Set();
      const statusSet = new Set();
      allRows = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(col => col.trim());
        const testName = cols[nameIndex]?.trim();
        const trainee = cols[traineeIndex]?.trim() || 'Unknown';
        const templateStatus = cols[templateStatusIndex]?.trim().toLowerCase().replace(/ /g, '-') || 'unknown';

        if (!testName) continue;

        traineeSet.add(trainee);
        statusSet.add(templateStatus);

        const matched = results.find(r => r.name.trim() === testName);
        const status = matched ? matched.status : 'not found';

        allRows.push({ name: testName.trim(), status, trainee, templateStatus });
      }

      populateDropdown("traineeFilter", [...traineeSet]);
      populateDropdown("statusFilter", [...statusSet]);
      renderTable(allRows);
    };

    csvReader.readAsText(csvInput);
  };

  htmlReader.readAsText(htmlInput);
}

function populateDropdown(id, items) {
  const dropdown = document.getElementById(id);
  dropdown.innerHTML = '<option value="all">All</option>';
  items.forEach(val => {
    dropdown.innerHTML += `<option value="${escapeHTML(val)}">${escapeHTML(val)}</option>`;
  });
}

function renderTable(rows) {
  let html = '<table><thead><tr><th>Test Case</th><th>Extent Status</th><th>Trainee</th><th>Atomic Script Status</th></tr></thead><tbody>';
  rows.forEach(row => {
    const statusClass = row.status.replace(/ /g, '-').toLowerCase();
    const templateClass = row.templateStatus;
    html += `<tr class="${escapeHTML(statusClass)} ${escapeHTML(templateClass)}">
                <td>${escapeHTML(row.name)}</td>
                <td>${escapeHTML(row.status)}</td>
                <td>${escapeHTML(row.trainee)}</td>
                <td>${escapeHTML(row.templateStatus)}</td>
             </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('results').innerHTML = html;
}

function filterStatus(status) {
  const traineeFilter = document.getElementById("traineeFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;
  let filtered = allRows;

  if (status !== 'all') filtered = filtered.filter(row => row.status === status);
  if (traineeFilter !== 'all') filtered = filtered.filter(row => row.trainee === traineeFilter);
  if (statusFilter !== 'all') filtered = filtered.filter(row => row.templateStatus === statusFilter);

  renderTable(filtered);
}

function filterByTrainee() {
  filterStatus('all');
}
