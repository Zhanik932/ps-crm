// static/js/roles.js

window.initializeRolesPage = function() {
    const token = localStorage.getItem('token');
    let currentEditingId = null;

    const roleModal = document.getElementById('roleModal');
    const roleForm = document.getElementById('roleForm');
    const closeModalBtn = document.getElementById('closeRoleModalBtn');
    const cancelBtn = document.getElementById('cancelRoleBtn');
    const modalTitle = roleModal.querySelector('.modal-header h4');
    const tableBody = document.getElementById("rolesTableBody");
    const addRoleBtn = document.getElementById('addRoleBtn');

    if (!roleModal || !roleForm || !tableBody || !addRoleBtn) {
        console.error("Необходимые элементы для страницы ролей не найдены.");
        return;
    }

    const openModal = () => roleModal.style.display = 'flex';
    const closeModal = () => {
        roleModal.style.display = 'none';
        roleForm.reset();
        currentEditingId = null;
    };

    const openModalForCreate = () => {
        currentEditingId = null;
        modalTitle.textContent = "Создать роль";
        roleForm.reset();
        openModal();
    };

    const openModalForEdit = async (id) => {
        currentEditingId = id;
        modalTitle.textContent = "Изменить роль";
        roleForm.reset();
        
        try {
            const res = await fetch(`/api/roles/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Не удалось загрузить данные роли.');
            const role = await res.json();
            
            document.getElementById('roleName').value = role.name;
            document.getElementById('roleDescription').value = role.description;
            openModal();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(roleForm);
        const data = {
            name: formData.get('name'),
            description: formData.get('description'),
        };

        const url = currentEditingId ? `/api/roles/${currentEditingId}` : '/api/roles';
        const method = currentEditingId ? 'PUT' : 'POST';

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
            window.showRoles();
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        }
    };
    
    const handleDelete = async (id) => {
        if (!confirm(`Вы уверены, что хотите удалить роль ID ${id}?`)) return;

        try {
            const res = await fetch(`/api/roles/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Ошибка удаления');
            }
            window.showRoles();
        } catch (error) {
            alert(error.message);
        }
    };

    addRoleBtn.addEventListener('click', openModalForCreate);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    roleForm.addEventListener('submit', handleFormSubmit);

    // Используем делегирование событий
    tableBody.addEventListener('click', (e) => {
        const actionButton = e.target.closest('.action-button');
        const editBtn = e.target.closest('.edit-role-btn');
        const deleteBtn = e.target.closest('.delete-role-btn');

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

    // Закрытие выпадающих меню по клику вне их
    document.addEventListener('click', function (event) {
        document.querySelectorAll('.action-dropdown.show').forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('show');
            }
        });
    });
};
