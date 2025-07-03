// static/js/users.js

// Эта функция будет вызвана из dashboard.js после загрузки HTML
window.initializeUsersPage = function() {
    const token = localStorage.getItem('token');
    let currentEditingId = null;

    // Элементы DOM
    const userModal = document.getElementById('userModal');
    const userForm = document.getElementById('userForm');
    const closeModalBtn = document.getElementById('closeUserModalBtn');
    const cancelBtn = document.getElementById('cancelUserBtn');
    const modalTitle = userModal ? userModal.querySelector('.modal-header h4') : null;
    const tableBody = document.getElementById("usersTableBody");
    const addUserBtn = document.getElementById('addUserBtn');

    if (!userModal || !userForm || !tableBody || !addUserBtn) {
        console.error("Необходимые элементы для страницы пользователей не найдены.");
        return;
    }

    // --- Функции для модального окна ---
    const openModal = () => userModal.style.display = 'flex';
    const closeModal = () => {
        userModal.style.display = 'none';
        userForm.reset();
        currentEditingId = null;
    };

    // --- Загрузка ролей в селект ---
    async function populateRolesSelect(selectedRoleIds = []) {
        const rolesSelect = document.getElementById('roles');
        if (!rolesSelect) return;

        try {
            const res = await fetch('/api/roles', { headers: { 'Authorization': `Bearer ${token}` } });
            const roles = await res.json();
            rolesSelect.innerHTML = '';
            roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.name;
                if (selectedRoleIds.includes(role.id)) {
                    option.selected = true;
                }
                rolesSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Ошибка загрузки ролей:", error);
        }
    }

    // --- Открытие модального окна для создания ---
    const openModalForCreate = () => {
        currentEditingId = null;
        modalTitle.textContent = "Создать пользователя";
        userForm.reset();

        // **ИСПРАВЛЕНИЕ 1:** Сбрасываем фото до стандартного при создании нового пользователя
        const userPhotoPreview = document.getElementById('userPhotoPreview');
        if (userPhotoPreview) {
            userPhotoPreview.src = '/static/placeholder.png';
        }
        
        document.getElementById('login').readOnly = false;
        document.getElementById('password-group').style.display = 'block';
        document.getElementById('password').placeholder = "Пароль (обязательно)";
        populateRolesSelect();
        openModal();
    };

    // --- Открытие модального окна для редактирования ---
    const openModalForEdit = async (id) => {
        currentEditingId = id;
        modalTitle.textContent = "Изменить пользователя";
        userForm.reset();
        
        try {
            const res = await fetch(`/api/users/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Не удалось загрузить данные пользователя.');
            const user = await res.json();

            // **ИСПРАВЛЕНИЕ 2:** Устанавливаем фото ПОСЛЕ получения данных, чтобы избежать моргания
            const userPhotoPreview = document.getElementById('userPhotoPreview');
            if (userPhotoPreview) {
                userPhotoPreview.src = user.photoUrl || '/static/placeholder.png';
            }

            document.getElementById('login').value = user.login;
            document.getElementById('login').readOnly = true;
            document.getElementById('fullName').value = user.fullName;
            document.getElementById('email').value = user.email;
            document.getElementById('phone').value = user.phone || '';
            document.getElementById('status').value = user.status;
            document.getElementById('password-group').style.display = 'block';
            document.getElementById('password').placeholder = "Оставьте пустым, чтобы не менять";

            const selectedRoles = user.roles ? user.roles.map(r => r.id) : [];
            await populateRolesSelect(selectedRoles);
            
            openModal();
        } catch (error) {
            alert(error.message);
        }
    };

    // --- Обработка отправки формы (без изменений) ---
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(userForm);
        const roleIds = Array.from(formData.getAll('roles')).map(Number);

        const data = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            status: formData.get('status'),
            roleIds: roleIds,
        };

        let url, method;

        if (currentEditingId) {
            url = `/api/users/${currentEditingId}`;
            method = 'PUT';
            if (formData.get('password')) {
                data.password = formData.get('password');
            }
        } else {
            url = '/api/users';
            method = 'POST';
            data.login = formData.get('login');
            data.password = formData.get('password');
            if (!data.password) {
                alert("Пароль обязателен при создании нового пользователя.");
                return;
            }
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Произошла ошибка');
            }

            closeModal();
            window.showUsers(); // Перезагружаем список пользователей
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        }
    };
    
    // --- Удаление пользователя (без изменений) ---
    const handleDelete = async (id) => {
        if (!confirm(`Вы уверены, что хотите удалить пользователя ID ${id}?`)) return;

        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Ошибка удаления');
            window.showUsers(); // Перезагружаем список
        } catch (error) {
            alert(error.message);
        }
    };

    // --- Привязка событий (без изменений) ---
    addUserBtn.addEventListener('click', openModalForCreate);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    userForm.addEventListener('submit', handleFormSubmit);

    tableBody.addEventListener('click', (e) => {
        const actionButton = e.target.closest('.action-button');
        const editBtn = e.target.closest('.edit-user-btn');
        const deleteBtn = e.target.closest('.delete-user-btn');

        if (actionButton) {
            actionButton.closest('.action-dropdown').classList.toggle('show');
        }
        
        if (editBtn) {
            e.preventDefault();
            openModalForEdit(editBtn.dataset.id);
        }
        
        if (deleteBtn) {
            e.preventDefault();
            handleDelete(deleteBtn.dataset.id);
        }
    });
    
    document.addEventListener('click', function (event) {
        document.querySelectorAll('.action-dropdown.show').forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('show');
            }
        });
    });
};