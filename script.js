// Global variables
let selectedGroup = null;
let selectedStudent = null;
let speechHistory = JSON.parse(localStorage.getItem('speechHistory') || '[]');

// Login function
function login() {
    const key = document.getElementById('adminKey').value;
    if (key === ADMIN_KEY) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        loadGroupsGrid();
        updateHistory();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

// Page navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    if (pageId === 'resultsPage') {
        updateHistory();
        showHistory();
    }
}

// Load groups grid
function loadGroupsGrid() {
    const groupsGrid = document.getElementById('groupsGrid');
    groupsGrid.innerHTML = '';

    Object.keys(groupedStudents).forEach(groupName => {
        const groupCard = document.createElement('div');
        groupCard.className = 'group-card';
        groupCard.onclick = () => selectGroup(groupName);

        const studentCount = groupedStudents[groupName].length;
        groupCard.innerHTML = `
            <h3>${groupName}</h3>
            <div class="student-count">${studentCount} học sinh</div>
        `;

        groupsGrid.appendChild(groupCard);
    });
}

// Select group
function selectGroup(groupName) {
    selectedGroup = groupName;
    document.getElementById('selectedGroupTitle').textContent = `Nhóm ${groupName}`;

    const studentsList = document.getElementById('studentsList');
    studentsList.innerHTML = '';

    groupedStudents[groupName].forEach(student => {
        const studentCard = document.createElement('div');
        studentCard.className = 'student-card';
        studentCard.onclick = () => selectStudent(student);

        studentCard.innerHTML = `
            <h4>${student.name}</h4>
            <div class="student-id">ID: ${student.id}</div>
        `;

        studentsList.appendChild(studentCard);
    });

    document.getElementById('groupSelection').style.display = 'none';
    document.getElementById('studentSelection').style.display = 'block';
}

// Select student
function selectStudent(student) {
    selectedStudent = student;
    document.getElementById('selectedStudentInfo').textContent =
        `${student.name} - Nhóm ${student.group} (ID: ${student.id})`;

    const sessionsGrid = document.getElementById('sessionsGrid');
    sessionsGrid.innerHTML = '';

    for (let i = 1; i <= 9; i++) {
        const sessionCard = document.createElement('div');
        sessionCard.className = 'session-card';
        sessionCard.onclick = () => addSpeechRecord(i);

        sessionCard.innerHTML = `
            <h3>Buổi ${i}</h3>
        `;

        sessionsGrid.appendChild(sessionCard);
    }

    document.getElementById('studentSelection').style.display = 'none';
    document.getElementById('sessionSelection').style.display = 'block';
}

// Add speech record
function addSpeechRecord(session) {
    const record = {
        id: Date.now(),
        studentName: selectedStudent.name,
        studentId: selectedStudent.id,
        groupName: selectedStudent.group,
        session: session,
        timestamp: new Date().toLocaleString('vi-VN')
    };

    speechHistory.unshift(record);
    localStorage.setItem('speechHistory', JSON.stringify(speechHistory));

    // Reset selections and go back to home
    selectedGroup = null;
    selectedStudent = null;
    backToGroups();
    showPage('homePage');

    // Show success message
    alert(`✅ Đã cộng điểm cho ${record.studentName} - Buổi ${session}!`);
}

// Navigation functions
function backToGroups() {
    document.getElementById('groupSelection').style.display = 'block';
    document.getElementById('studentSelection').style.display = 'none';
    document.getElementById('sessionSelection').style.display = 'none';
}

function backToStudents() {
    document.getElementById('studentSelection').style.display = 'block';
    document.getElementById('sessionSelection').style.display = 'none';
}

// Update history display
function updateHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    if (speechHistory.length === 0) {
        historyList.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;">Chưa có lịch sử phát biểu</div>';
        return;
    }

    speechHistory.forEach(record => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        historyItem.innerHTML = `
            <div class="history-info">
                <h4>${record.studentName} (${record.studentId})</h4>
                <p>Nhóm: ${record.groupName} | Buổi: ${record.session} | ${record.timestamp}</p>
            </div>
            <button class="delete-btn" onclick="deleteRecord(${record.id})">❌</button>
        `;

        historyList.appendChild(historyItem);
    });
}

// Delete record
function deleteRecord(recordId) {
    if (confirm('Bạn có chắc muốn xóa bản ghi này?')) {
        speechHistory = speechHistory.filter(record => record.id !== recordId);
        localStorage.setItem('speechHistory', JSON.stringify(speechHistory));
        updateHistory();
        updateGroupStats();
    }
}

// Show group statistics
function showGroupStats() {
    document.getElementById('historyView').style.display = 'none';
    document.getElementById('statsView').style.display = 'block';
    document.getElementById('groupDetailView').style.display = 'none';
    updateGroupStats();
}

// Show history
function showHistory() {
    document.getElementById('historyView').style.display = 'block';
    document.getElementById('statsView').style.display = 'none';
    document.getElementById('groupDetailView').style.display = 'none';
    updateHistory();
}

// Update group statistics
function updateGroupStats() {
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = '';

    // Count scores by group
    const groupScores = {};
    Object.keys(groupedStudents).forEach(groupName => {
        groupScores[groupName] = speechHistory.filter(record => record.groupName === groupName).length;
    });

    // Create stat cards
    Object.keys(groupedStudents).forEach(groupName => {
        const statCard = document.createElement('div');
        statCard.className = 'stat-card';
        statCard.onclick = () => showGroupDetail(groupName);

        statCard.innerHTML = `
            <h3>${groupName}</h3>
            <div class="score">${groupScores[groupName] || 0}</div>
            <p>điểm</p>
        `;

        statsGrid.appendChild(statCard);
    });
}

// Show group detail
function showGroupDetail(groupName) {
    document.getElementById('statsView').style.display = 'none';
    document.getElementById('groupDetailView').style.display = 'block';
    document.getElementById('groupDetailTitle').textContent = `Chi Tiết Nhóm ${groupName}`;

    const groupDetailList = document.getElementById('groupDetailList');
    groupDetailList.innerHTML = '';

    const groupRecords = speechHistory.filter(record => record.groupName === groupName);

    if (groupRecords.length === 0) {
        groupDetailList.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;">Nhóm này chưa có lịch sử phát biểu</div>';
        return;
    }

    groupRecords.forEach(record => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        historyItem.innerHTML = `
            <div class="history-info">
                <h4>${record.studentName} (${record.studentId})</h4>
                <p>Buổi: ${record.session} | ${record.timestamp}</p>
            </div>
            <button class="delete-btn" onclick="deleteRecord(${record.id})">❌</button>
        `;

        groupDetailList.appendChild(historyItem);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    // Focus on login input
    document.getElementById('adminKey').focus();

    // Allow enter key to login
    document.getElementById('adminKey').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            login();
        }
    });
});