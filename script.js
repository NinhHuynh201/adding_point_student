// Viewport Height
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setViewportHeight();
window.addEventListener('resize', setViewportHeight);

// ======================== GLOBAL VARIABLES ========================
let selectedGroup = null;
let selectedStudent = null;
let currentAdmin = null;
let speechHistory = [];
let groupPositions = {}; // Lưu vị trí các nhóm
let selectedPositionIndex = null;

// Supabase
const SUPABASE_URL = 'https://zhpyxxynfgzarbxmkscf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocHl4eHluZmd6YXJieG1rc2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MzM1ODMsImV4cCI6MjA3MDEwOTU4M30.YdWDWCIhHjELLeeb6dQ_cA8kOm4rehqv3yIw8S7WFK0';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// ======================== AUTHENTICATION ========================
async function login() {
    const key = document.getElementById('adminKey').value;
    const loginError = document.getElementById('loginError');
    const loginLoading = document.getElementById('loginLoading');

    if (!key) {
        loginError.textContent = 'Vui lòng nhập mã khóa!';
        loginError.style.display = 'block';
        return;
    }

    loginError.style.display = 'none';
    loginLoading.style.display = 'block';

    try {
        // Check admin credentials in Supabase
        const { data, error } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('admin_key', key)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        await supabaseClient
            .from('admin_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.id);

        currentAdmin = data;

        // Show main app
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';

        // Update admin info
        document.getElementById('adminInfo').textContent = `Đăng nhập: ${data.username}`;

        // Load data
        await loadGroupPositions();
        loadGroupsGrid();
        await loadSpeechHistory();

    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'Mã khóa không đúng!';
        loginError.style.display = 'block';
    } finally {
        loginLoading.style.display = 'none';
    }
}

// ======================== GROUP POSITIONS MANAGEMENT ========================
async function loadGroupPositions() {
    try {
        const { data, error } = await supabaseClient
            .from('group_positions')
            .select('*')
            .single();

        if (data && data.positions) {
            groupPositions = data.positions;
        } else {
            // Default positions if no configuration exists
            groupPositions = {
                '0': 'Yêu Thương',
                '1': 'Vui Mừng',
                '2': 'Bình An',
                '3': 'Nhịn Nhục',
                '4': 'Nhân Từ',
                '5': 'Hiền Lành',
                '6': 'Trung Tín',
                '7': 'Mềm Mại'
            };
        }
    } catch (error) {
        console.error('Error loading group positions:', error);
        // Use default positions
        groupPositions = {
            '0': 'Yêu Thương',
            '1': 'Vui Mừng',
            '2': 'Bình An',
            '3': 'Nhịn Nhục',
            '4': 'Nhân Từ',
            '5': 'Hiền Lành',
            '6': 'Trung Tín',
            '7': 'Mềm Mại'
        };
    }
}

async function saveGroupPositions() {
    try {
        // Check if record exists
        const { data: existing, error: fetchError } = await supabaseClient
            .from('group_positions')
            .select('id')
            .single();

        if (existing) {
            // Update existing record
            const { error: updateError } = await supabaseClient
                .from('group_positions')
                .update({ positions: groupPositions })
                .eq('id', existing.id);
            
            if (updateError) throw updateError;
        } else {
            // Insert new record
            const { error: insertError } = await supabaseClient
                .from('group_positions')
                .insert({ positions: groupPositions });
            
            if (insertError) throw insertError;
        }

        hidePositionSelector();
        loadGroupsGrid();
        alert('✅ Đã lưu cấu hình vị trí nhóm thành công!');

    } catch (error) {
        console.error('Error saving group positions:', error);
        alert('❌ Có lỗi xảy ra khi lưu cấu hình. Vui lòng thử lại!');
    }
}

function showPositionSelector() {
    document.getElementById('groupSelection').style.display = 'none';
    document.getElementById('positionSelector').style.display = 'block';
    loadPositionGrid();
}

function hidePositionSelector() {
    document.getElementById('positionSelector').style.display = 'none';
    document.getElementById('groupSelection').style.display = 'block';
    document.getElementById('groupSelectorContainer').style.display = 'none';
    selectedPositionIndex = null;
}

function loadPositionGrid() {
    const positionGrid = document.getElementById('positionGrid');
    positionGrid.innerHTML = '';

    // Create 8 position slots (4 rows x 2 columns)
    for (let i = 0; i < 8; i++) {
        const positionSlot = document.createElement('div');
        positionSlot.className = 'position-slot';
        positionSlot.onclick = () => selectPosition(i);

        const positionLabel = `Vị trí ${i + 1}`;
        const groupName = groupPositions[i] || null;

        if (groupName) {
            positionSlot.classList.add('filled');
            positionSlot.innerHTML = `
                <div class="position-label">${positionLabel}</div>
                <div class="group-name">${groupName}</div>
            `;
        } else {
            positionSlot.innerHTML = `
                <div class="position-label">${positionLabel}</div>
                <div class="empty-text">Chọn nhóm</div>
            `;
        }

        positionGrid.appendChild(positionSlot);
    }
}

function selectPosition(positionIndex) {
    selectedPositionIndex = positionIndex;
    document.getElementById('selectedPositionLabel').textContent = `${positionIndex + 1}`;
    
    // Show group selector
    document.getElementById('groupSelectorContainer').style.display = 'block';
    loadGroupSelector();
}

function loadGroupSelector() {
    const groupSelector = document.getElementById('groupSelector');
    groupSelector.innerHTML = '';

    // Get all group names
    const allGroups = Object.keys(groupedStudents);
    
    // Get already assigned groups
    const assignedGroups = Object.values(groupPositions);

    allGroups.forEach(groupName => {
        const groupOption = document.createElement('div');
        groupOption.className = 'group-option';
        
        // Check if this group is already assigned to another position
        const isAssigned = assignedGroups.includes(groupName) && 
                          groupPositions[selectedPositionIndex] !== groupName;
        
        if (isAssigned) {
            groupOption.classList.add('disabled');
            groupOption.textContent = `${groupName} (đã chọn)`;
        } else {
            groupOption.textContent = groupName;
            groupOption.onclick = () => assignGroupToPosition(groupName);
        }

        groupSelector.appendChild(groupOption);
    });

    // Add option to clear position
    if (groupPositions[selectedPositionIndex]) {
        const clearOption = document.createElement('div');
        clearOption.className = 'group-option';
        clearOption.style.background = '#e53e3e';
        clearOption.textContent = '❌ Xóa';
        clearOption.onclick = () => assignGroupToPosition(null);
        groupSelector.appendChild(clearOption);
    }
}

function assignGroupToPosition(groupName) {
    if (groupName) {
        groupPositions[selectedPositionIndex] = groupName;
    } else {
        delete groupPositions[selectedPositionIndex];
    }
    
    // Hide group selector and refresh position grid
    document.getElementById('groupSelectorContainer').style.display = 'none';
    loadPositionGrid();
    selectedPositionIndex = null;
}

function resetPositions() {
    if (confirm('Bạn có chắc muốn đặt lại tất cả vị trí về mặc định?')) {
        groupPositions = {
            '0': 'Yêu Thương',
            '1': 'Vui Mừng',
            '2': 'Bình An',
            '3': 'Nhịn Nhục',
            '4': 'Nhân Từ',
            '5': 'Hiền Lành',
            '6': 'Trung Tín',
            '7': 'Mềm Mại'
        };
        loadPositionGrid();
        document.getElementById('groupSelectorContainer').style.display = 'none';
    }
}

// ======================== DATA MANAGEMENT ========================
async function loadSpeechHistory() {
    try {
        const { data, error } = await supabaseClient
            .from('speech_history')
            .select(`
                *,
                admin_users!inner(username)
            `)
            .eq('admin_id', currentAdmin.id) // 🔥 Lọc theo admin đang đăng nhập
            .order('created_at', { ascending: false });

        if (error) throw error;

        speechHistory = data.map(record => ({
            id: record.id,
            studentName: record.student_name,
            studentId: record.student_id,
            groupName: record.group_name,
            session: record.session,
            timestamp: new Date(record.created_at).toLocaleString('vi-VN'),
            adminName: record.admin_users.username
        }));

        updateHistory();
    } catch (error) {
        console.error('Error loading speech history:', error);
        speechHistory = [];
    }
}


async function addSpeechRecord(session) {
    try {
        const record = {
            student_name: selectedStudent.name,
            student_id: selectedStudent.id,
            group_name: selectedStudent.group,
            session: session,
            admin_id: currentAdmin.id
        };

        const { data, error } = await supabaseClient
            .from('speech_history')
            .insert(record)
            .select()
            .single();

        if (error) throw error;

        // Add to local history for immediate update
        speechHistory.unshift({
            id: data.id,
            studentName: record.student_name,
            studentId: record.student_id,
            groupName: record.group_name,
            session: record.session,
            timestamp: new Date(data.created_at).toLocaleString('vi-VN'),
            adminName: currentAdmin.username
        });

        // Reset selections and go back to home
        selectedGroup = null;
        selectedStudent = null;
        backToGroups();
        showPage('homePage');

        // Show success message
        alert(`✅ Đã cộng điểm cho ${record.student_name} - Buổi ${session}!`);

    } catch (error) {
        console.error('Error adding speech record:', error);
        alert('❌ Có lỗi xảy ra khi thêm điểm. Vui lòng thử lại!');
    }
}

async function deleteRecord(recordId) {
    if (!confirm('Bạn có chắc muốn xóa bản ghi này?')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('speech_history')
            .delete()
            .eq('id', recordId);

        if (error) throw error;

        // Remove from local history
        speechHistory = speechHistory.filter(record => record.id !== recordId);
        updateHistory();
        updateGroupStats();

        alert('✅ Đã xóa bản ghi thành công!');

    } catch (error) {
        console.error('Error deleting record:', error);
        alert('❌ Có lỗi xảy ra khi xóa. Vui lòng thử lại!');
    }
}

// ======================== PAGE NAVIGATION ========================
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

// ======================== GROUP AND STUDENT SELECTION ========================
function loadGroupsGrid() {
    const groupsGrid = document.getElementById('groupsGrid');
    groupsGrid.innerHTML = '';

    // Create grid based on groupPositions order
    for (let i = 0; i < 8; i++) {
        const groupName = groupPositions[i];
        
        if (groupName && groupedStudents[groupName]) {
            const groupCard = document.createElement('div');
            groupCard.className = 'group-card';
            groupCard.onclick = () => selectGroup(groupName);

            const studentCount = groupedStudents[groupName].length;
            groupCard.innerHTML = `
                        <h3>${groupName}</h3>
                        <div class="student-count">${studentCount} học sinh</div>
                    `;

            groupsGrid.appendChild(groupCard);
        }
    }

    setViewportHeight();
    window.scrollTo(0, 0);
}

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

function backToGroups() {
    document.getElementById('groupSelection').style.display = 'block';
    document.getElementById('studentSelection').style.display = 'none';
    document.getElementById('sessionSelection').style.display = 'none';
}

function backToStudents() {
    document.getElementById('studentSelection').style.display = 'block';
    document.getElementById('sessionSelection').style.display = 'none';
}

// ======================== RESULTS AND STATISTICS ========================
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
                        <small style="color: #9ca3af;">Bởi: ${record.adminName || 'Admin'}</small>
                    </div>
                    <button class="delete-btn" onclick="deleteRecord('${record.id}')">❌</button>
                `;

        historyList.appendChild(historyItem);
    });
}

function showGroupStats() {
    document.getElementById('historyView').style.display = 'none';
    document.getElementById('statsView').style.display = 'block';
    document.getElementById('groupDetailView').style.display = 'none';
    updateGroupStats();
}

function showHistory() {
    document.getElementById('historyView').style.display = 'block';
    document.getElementById('statsView').style.display = 'none';
    document.getElementById('groupDetailView').style.display = 'none';
    updateHistory();

    setViewportHeight();
    window.scrollTo(0, 0);
}

function updateGroupStats() {
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = '';

    // Đếm điểm theo nhóm (chỉ điểm của admin hiện tại)
    const groupScores = {};
    Object.keys(groupedStudents).forEach(groupName => {
        groupScores[groupName] = speechHistory.filter(record =>
            record.groupName === groupName &&
            record.adminName === currentAdmin.username
        ).length;
    });

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
                        <small style="color: #9ca3af;">Bởi: ${record.adminName || 'Admin'}</small>
                    </div>
                    <button class="delete-btn" onclick="deleteRecord('${record.id}')">❌</button>
                `;

        groupDetailList.appendChild(historyItem);
    });
}

// ======================== INITIALIZATION ========================
document.addEventListener('DOMContentLoaded', function () {
    // Check if Supabase is configured
    if (SUPABASE_URL === 'https://zhpyxxynfgzarbxmkscf.supabase.co' || SUPABASE_KEY === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocHl4eHluZmd6YXJieG1rc2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MzM1ODMsImV4cCI6MjA3MDEwOTU4M30.YdWDWCIhHjELLeeb6dQ_cA8kOm4rehqv3yIw8S7WFK0') {
        alert('⚠️ Cần cấu hình Supabase URL và Key trước khi sử dụng!');
    }

    // Focus on login input
    document.getElementById('adminKey').focus();

    // Allow enter key to login
    document.getElementById('adminKey').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            login();
        }
    });
});