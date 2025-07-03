// Вся логика будет выполнена, когда dashboard.js вызовет эту функцию
window.showGrades = function() {
    console.log("Запуск логики для страницы 'Классы'");

    // --- Элементы DOM и глобальные переменные ---
    const token = localStorage.getItem('token');
    let tableBody;
    let gradeModal, gradeForm, addGradeBtn, closeGradeModalBtn, cancelGradeBtn, modalTitle;
    let currentEditingId = null; // Для отслеживания, создаем мы или редактируем

    // --- Функция для инициализации элементов после загрузки HTML ---
    function initializeDOMElements() {
        tableBody = document.getElementById("gradesTableBody");
        gradeModal = document.getElementById('gradeModal');
        gradeForm = document.getElementById('gradeForm');
        addGradeBtn = document.getElementById('addGradeBtn');
        closeGradeModalBtn = document.getElementById('closeGradeModalBtn');
        cancelGradeBtn = document.getElementById('cancelGradeBtn');
        modalTitle = gradeModal ? gradeModal.querySelector('.modal-header h4') : null;

        if (!tableBody || !gradeModal) {
            console.error("Критические элементы DOM не найдены.");
            return false;
        }
        return true;
    }

    // --- Функции для модального окна ---
    function openModalForCreate() {
        currentEditingId = null;
        modalTitle.innerText = "Создать класс";
        gradeForm.reset();
        gradeModal.style.display = 'flex';
    }

    async function openModalForEdit(id) {
        currentEditingId = id;
        modalTitle.innerText = "Изменить класс";
        try {
            const res = await fetch(`/api/classes/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Не удалось загрузить данные класса');
            
            const classData = await res.json();
            
            // Заполняем форму
            gradeForm.elements.gradeNumber.value = classData.grade_number;
            gradeForm.elements.gradeLiter.value = classData.liter_char;
            gradeForm.elements.studyType.value = classData.study_type;
            gradeForm.elements.studyLanguage.value = classData.language;
            // TODO: Загружать и устанавливать учителя
            
            gradeModal.style.display = 'flex';

        } catch(error) {
            console.error("Ошибка при открытии окна редактирования:", error);
            alert("Не удалось загрузить информацию о классе.");
        }
    }

    function closeModal() {
        gradeModal.style.display = 'none';
        gradeForm.reset();
        currentEditingId = null;
    }

    // --- Функция для отрисовки таблицы ---
    function renderTable(grades) {
        if (!tableBody) return;
        if (grades && grades.length > 0) {
            tableBody.innerHTML = grades.map(g => `
                <tr data-grade-id="${g.id}">
                    <td class="text-center">
                        <div class="action-dropdown">
                            <button class="action-button">Действия <i class="bi bi-chevron-down"></i></button>
                            <div class="action-dropdown-content">
                                <a href="#" class="edit-grade-btn" data-id="${g.id}"><i class="bi bi-pencil"></i> Изменить</a>
                                <a href="#" class="delete-grade-btn" data-id="${g.id}"><i class="bi bi-trash"></i> Удалить</a>
                            </div>
                        </div>
                    </td>
                    <td>${g.grade_number}</td>
                    <td>${g.liter_char}</td>
                    <td>${g.student_count || 0}</td>
                    <td>${g.teacher_name || 'Не назначен'}</td>
                    <td>${g.study_type || '—'}</td>
                    <td>${g.language || '—'}</td>
                </tr>
            `).join('');
        } else {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Классы еще не созданы.</td></tr>`;
        }
        attachActionHandlers(); // Перепривязываем обработчики
    }
    
    // --- Обработка отправки формы ---
    async function handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(gradeForm);
        
        const data = {
            grade_number: parseInt(formData.get('gradeNumber'), 10),
            liter_char: formData.get('gradeLiter'),
            study_type: formData.get('studyType'),
            language: formData.get('studyLanguage'),
            // teacher_id можно будет добавить, когда будет API для списка учителей
        };

        const url = currentEditingId ? `/api/classes/${currentEditingId}` : '/api/classes';
        const method = currentEditingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Произошла ошибка');
            }
            
            closeModal();
            fetchGrades(); // Обновляем таблицу
            alert(`Класс успешно ${currentEditingId ? 'обновлен' : 'создан'}!`);

        } catch (error) {
            console.error("Ошибка при сохранении класса:", error);
            alert(`Ошибка: ${error.message}`);
        }
    }

    // --- Удаление класса ---
    async function handleDelete(id) {
        if (!confirm(`Вы уверены, что хотите удалить класс ID ${id}? Это действие нельзя отменить.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/classes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(errorData.error || 'Ошибка удаления');
            }
            
            fetchGrades(); // Обновляем таблицу
            alert('Класс успешно удален.');

        } catch (error) {
            console.error("Ошибка при удалении:", error);
            alert(`Ошибка: ${error.message}`);
        }
    }


    // --- Привязка обработчиков к кнопкам действий ---
    function attachActionHandlers() {
        document.querySelectorAll('.edit-grade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openModalForEdit(e.currentTarget.dataset.id);
            });
        });

        document.querySelectorAll('.delete-grade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleDelete(e.currentTarget.dataset.id);
            });
        });

         // Закрытие выпадающего меню
        document.querySelectorAll('.action-button').forEach(button => {
            button.addEventListener('click', function(event) {
                event.stopPropagation();
                const dropdown = this.closest('.action-dropdown');
                dropdown.classList.toggle('show');
            });
        });
    }

    // --- ГЛАВНАЯ ФУНКЦИЯ: Загрузка данных с сервера ---
    async function fetchGrades() {
        if (!tableBody) return;
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Загрузка данных...</td></tr>`;
        try {
            const response = await fetch('/api/classes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Сервер ответил с ошибкой ${response.status}. Ответ: ${errorText}`);
            }

            const grades = await response.json();
            renderTable(grades);

        } catch (error) {
            console.error("Произошла ошибка при загрузке списка классов:", error);
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Ошибка загрузки данных. Откройте консоль (F12) для деталей.</td></tr>`;
        }
    }

    // --- Инициализация страницы ---
    if (initializeDOMElements()) {
        addGradeBtn.addEventListener('click', openModalForCreate);
        closeGradeModalBtn.addEventListener('click', closeModal);
        cancelGradeBtn.addEventListener('click', closeModal);
        gradeForm.addEventListener('submit', handleFormSubmit);

        // Закрытие модального окна по клику на фон
        gradeModal.addEventListener('click', (e) => {
            if (e.target === gradeModal) {
                closeModal();
            }
        });
        
      // static/js/grades.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
document.addEventListener('click', function(event) {
    document.querySelectorAll('.action-dropdown.show').forEach(dropdown => {
        // Проверяем, был ли клик вне области выпадающего меню
        if (!dropdown.contains(event.target)) {
            dropdown.classList.remove('show');
        }
    });
});

        fetchGrades(); // Запускаем загрузку данных
    }
};