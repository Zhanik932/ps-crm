// static/js/students.js

const token = localStorage.getItem('token');

// Глобальные переменные для элементов DOM
let studentModal, studentForm, closeModalBtn, cancelBtn, modalTitle;
let currentEditingId = null;

// --- НОВАЯ ФУНКЦИЯ: Форматирование номера телефона ---
function formatStudentPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.startsWith('7') || value.startsWith('8')) {
        value = value.substring(1);
    }
    let formattedValue = '+7 ';
    if (value.length > 0) {
        formattedValue += '(' + value.substring(0, 3);
    }
    if (value.length >= 4) {
        formattedValue += ') ' + value.substring(3, 6);
    }
    if (value.length >= 7) {
        formattedValue += '-' + value.substring(6, 8);
    }
    if (value.length >= 9) {
        formattedValue += '-' + value.substring(8, 10);
    }
    input.value = formattedValue;
}

// Функция для инициализации DOM-элементов
function initializeStudentPageElements() {
    studentModal = document.getElementById('studentModal');
    studentForm = document.getElementById('studentForm');
    closeModalBtn = document.getElementById('closeModalBtn');
    cancelBtn = document.getElementById('cancelBtn');
    modalTitle = studentModal ? studentModal.querySelector('.modal-header h4') : null;

    closeModalBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    studentForm?.addEventListener('submit', handleStudentFormSubmit);

    // --- ДОБАВЛЕНО: Применение форматирования к полям ---
    ['studentPhone', 'mothersPhone', 'fathersPhone', 'contractParentPhone'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => formatStudentPhoneNumber(input));
        }
    });

    // Логика вкладок
    studentModal?.querySelectorAll('.tab-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            studentModal.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
            studentModal.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            link.classList.add('active');
            studentModal.querySelector(`#${tabId}`)?.classList.add('active');
        });
    });

    // Закрытие выпадающих меню
    document.addEventListener('click', event => {
        document.querySelectorAll('.action-dropdown.show').forEach(dropdown => {
            if (!dropdown.contains(event.target)) dropdown.classList.remove('show');
        });
    });
}

// Функция для загрузки и отображения списка учеников
window.showStudents = async function() {
    const pageTitle = document.getElementById("pageTitle");
    const contentArea = document.getElementById("contentArea");

    if (!pageTitle || !contentArea) return;

    try {
        const response = await fetch('/static/html/students.html');
        if (!response.ok) throw new Error('Не удалось загрузить students.html');
        contentArea.innerHTML = await response.text();
        pageTitle.innerText = "Ученики";
    } catch (error) {
        contentArea.innerHTML = `<p class="text-danger">Ошибка загрузки страницы.</p>`;
        return;
    }

    initializeStudentPageElements();
    document.getElementById('addStudentBtn')?.addEventListener('click', openModalForCreate);
    fetchAndRenderStudents();
};

// Загрузка и отрисовка учеников
async function fetchAndRenderStudents() {
    const tableBody = document.getElementById("studentsTableBody");
    if (!tableBody) return;
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Загрузка...</td></tr>`;

    try {
        const res = await fetch("/api/students", { headers: { "Authorization": `Bearer ${token}` } });
        if (!res.ok) throw new Error('Ошибка сети или сервера.');
        const students = await res.json();
        
        if (students && students.length > 0) {
            tableBody.innerHTML = students.map(s => {
                const fullName = `${s.lastName || ""} ${s.firstName || ""} ${s.middleName || ""}`.trim();
                return `
                <tr data-student-id="${s.ID}">
                    <td><button class="contract-toggle-button" title="Показать/скрыть договоры"><i class="bi bi-eye"></i></button></td>
                    <td>${fullName}</td>
                    <td>${s.grade || '—'}</td>
                    <td>${s.liter || '—'}</td>
                    <td>${s.isStudying ? "Обучается" : "Не обучается"}</td>
                    <td class="text-center">
                        <div class="action-dropdown">
                            <button class="action-button">Действия <i class="bi bi-chevron-down"></i></button>
                            <div class="action-dropdown-content">
                                <a href="#" class="edit-student-btn" data-id="${s.ID}"><i class="bi bi-pencil"></i> Изменить</a>
                                <a href="#" class="delete-student-btn" data-id="${s.ID}"><i class="bi bi-trash"></i> Удалить</a>
                            </div>
                        </div>
                    </td>
                </tr>
                 <tr class="contracts-row" style="display: none;"><td colspan="6"><div class="contracts-section">Договоры в разработке</div></td></tr>
            `}).join('');
        } else {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Ученики еще не добавлены.</td></tr>`;
        }
        attachStudentActionHandlers();
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Не удалось загрузить список учеников.</td></tr>`;
    }
}

function openModalForCreate() {
    currentEditingId = null;
    modalTitle.innerText = "Создать ученика";
    studentForm.reset();
    studentModal.style.display = 'flex';
    populateClassesDropdown();
}

async function openModalForEdit(id) {
    currentEditingId = id;
    modalTitle.innerText = "Изменить ученика";
    studentForm.reset();
    
    try {
        const res = await fetch(`/api/students/${id}`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (!res.ok) throw new Error("Не удалось загрузить данные ученика");
        const student = await res.json();
        
        for (const key in student) {
            const formElement = studentForm.elements[key];
            if (formElement) {
                if (formElement.type === 'checkbox') {
                    formElement.checked = student[key];
                } else if (formElement.type === 'date' && student[key]) {
                    formElement.value = student[key].split('T')[0];
                } else if (formElement.type === 'tel') {
                    formElement.value = student[key];
                    // --- ДОБАВЛЕНО: Форматирование при загрузке данных ---
                    formatStudentPhoneNumber(formElement);
                }
                 else {
                    formElement.value = student[key];
                }
            }
        }
        
        await populateClassesDropdown(student.ClassID);
        studentModal.style.display = 'flex';

    } catch(error) {
        alert(error.message);
    }
}

function closeModal() {
    studentModal.style.display = 'none';
}

async function populateClassesDropdown(selectedClassId = null) {
    const classSelect = document.getElementById('classId');
    if (!classSelect) return;

    try {
        const res = await fetch('/api/classes', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Не удалось загрузить классы');
        const classes = await res.json();
        
        classSelect.innerHTML = '<option value="">Не выбрано</option>';
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = `${cls.grade_number} ${cls.liter_char}`;
            if (cls.id === selectedClassId) {
                option.selected = true;
            }
            classSelect.appendChild(option);
        });
    } catch (error) {
        classSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
    }
}

async function handleStudentFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(studentForm);
    let studentData = {};

    formData.forEach((value, key) => {
        if (value !== "") {
            studentData[key] = value;
        }
    });

    studentData.isStudying = studentForm.elements.isStudying.checked;
    studentData.isResident = studentForm.elements.isResident.checked;

    const classId = parseInt(studentData.classId, 10);
    studentData.classId = isNaN(classId) ? null : classId;
    
    const url = currentEditingId ? `/api/students/${currentEditingId}` : '/api/students';
    const method = currentEditingId ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(studentData)
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Произошла ошибка');
        }

        closeModal();
        fetchAndRenderStudents();
        alert(`Ученик успешно ${currentEditingId ? 'обновлен' : 'создан'}!`);
    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
}

async function handleDelete(id) {
    if (!confirm(`Вы уверены, что хотите удалить ученика ID ${id}?`)) return;

    try {
        const res = await fetch(`/api/students/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Ошибка удаления');
        }
        fetchAndRenderStudents();
        alert('Ученик успешно удален.');
    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
}

function attachStudentActionHandlers() {
    document.querySelectorAll('.action-button').forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation();
            this.closest('.action-dropdown').classList.toggle('show');
        });
    });
    
    document.querySelectorAll('.edit-student-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            openModalForEdit(e.currentTarget.dataset.id);
        });
    });

    document.querySelectorAll('.delete-student-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            handleDelete(e.currentTarget.dataset.id);
        });
    });
}