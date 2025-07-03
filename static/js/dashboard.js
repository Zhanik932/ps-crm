// ===============================================
// ЕДИНЫЙ ФАЙЛ ДЛЯ ДАШБОРДА (ПОЛНАЯ ВЕРСИЯ С ИСПРАВЛЕНИЯМИ)
// ===============================================
console.log("Файл dashboard.js успешно загружен и выполняется!");

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM полностью загружен. Начинаю привязывать события.");

    // ===============================================
    // 1. КОНСТАНТЫ И ОБЩИЕ ЭЛЕМЕНТЫ
    // ===============================================
    const token = localStorage.getItem("token");
    const pageTitle = document.getElementById("pageTitle");
    const contentArea = document.getElementById("contentArea");
    const logoutBtn = document.getElementById("logoutBtn");

    // Элементы профиля
    const profileLink = document.getElementById("userProfileLink");
    const editProfileModal = document.getElementById('editProfileModal');
    const editProfileForm = document.getElementById('editProfileForm');
    const closeProfileBtn = document.getElementById('closeProfileModalBtn');
    const cancelProfileBtn = document.getElementById('cancelProfileBtn');
    const photoPreview = document.getElementById('photoPreview');
    const photoInput = document.getElementById('photo');
    const phoneInput = document.getElementById('profile_phone');


    // ===============================================
    // 2. ПРОВЕРКА АВТОРИЗАЦИИ
    // ===============================================
    if (!token) {
        alert("Вы не авторизованы");
        window.location.href = "/";
        return;
    }


    // ===============================================
    // 3. ЛОГИКА ИНТЕРФЕЙСА (САЙДБАР)
    // ===============================================
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    if (sidebar && sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    }

    const navGroups = document.querySelectorAll('.nav-group-toggle');
    navGroups.forEach(function(toggle) {
        toggle.addEventListener('click', function() {
            if (sidebar && sidebar.classList.contains('collapsed')) {
                return;
            }
            navGroups.forEach(function(otherToggle) {
                if (otherToggle !== toggle) {
                    otherToggle.parentElement.classList.remove('open');
                    const otherLinks = otherToggle.nextElementSibling;
                    if (otherLinks) {
                        otherLinks.style.maxHeight = null;
                    }
                }
            });
            const group = this.parentElement;
            const links = this.nextElementSibling;
            group.classList.toggle('open');
            if (group.classList.contains('open')) {
                if (links) {
                    links.style.maxHeight = links.scrollHeight + "px";
                }
            } else {
                if (links) {
                    links.style.maxHeight = null;
                }
            }
        });
    });

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    // ===============================================
    // 4. ЛОГИКА ЗАГРУЗКИ КОНТЕНТА
    // ===============================================
    async function loadContent(url, callback) {
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error(`Ошибка загрузки контента: ${res.status}`);
            contentArea.innerHTML = await res.text();
            if (callback) callback();
        } catch (error) {
            console.error("Ошибка загрузки контента:", error);
            contentArea.innerHTML = `<div class="card"><div class="card-body text-center text-danger">Не удалось загрузить страницу.</div></div>`;
        }
    }

    // --- Функция для отображения страницы УЧЕНИКОВ ---
    window.loadStudentsPage = async function() {
        pageTitle.innerText = "Ученики";
        await loadContent('/static/html/students.html', () => {
            const script = document.createElement('script');
            script.src = '/static/js/students.js';
            script.onload = () => {
                if (window.showStudents) {
                    window.showStudents();
                }
            };
            document.body.appendChild(script);
        });
    }

    // --- Функция для отображения страницы КЛАССОВ ---
    window.loadGradesPage = async function() {
        pageTitle.innerText = "Классы";
        await loadContent('/static/html/grades.html', () => {
            const script = document.createElement('script');
            script.src = '/static/js/grades.js';
            script.onload = () => {
                if (window.showGrades) {
                    window.showGrades();
                }
            };
            document.body.appendChild(script);
        });
    }

    // --- Функция для отображения пользователей ---
  window.showUsers = async function() {
    pageTitle.innerText = "Пользователи";
    await loadContent('/static/html/users.html', async () => {
        const tableBody = document.getElementById("usersTableBody");
        if (!tableBody) return;
        try {
            const res = await fetch("/api/users", { headers: { "Authorization": `Bearer ${token}` } });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `Ошибка: ${res.status}`);
            }
            const users = await res.json();

            // --- ОБНОВЛЕНИЕ ЛОГИКИ РЕНДЕРИНГА ТАБЛИЦЫ ---
            if (users && users.length > 0) {
                
                tableBody.innerHTML = users.map(user => {
                    const statusBadge = user.status === 'active'
                        ? `<span style="color: green; font-weight: bold;">● Активен</span>`
                        : `<span style="color: red; font-weight: bold;">● Заблокирован</span>`;

                    const roles = user.roles && user.roles.length > 0 ? user.roles.join(', ') : 'Нет ролей';

                    return `
                    <tr data-id="${user.id}">
                        <td>${user.id}</td>
                        <td>${user.login}</td>
                        <td>${user.fullName}</td>
                        <td>${user.email}</td>
                        <td>${statusBadge}</td>
                        <td>${roles}</td>
                        <td class="text-center">
                            <div class="action-dropdown">
                                <button class="action-button">Действия <i class="bi bi-chevron-down"></i></button>
                                <div class="action-dropdown-content">
                                    <a href="#" class="edit-user-btn" data-id="${user.id}"><i class="bi bi-pencil"></i> Изменить</a>
                                    <a href="#" class="delete-user-btn" data-id="${user.id}"><i class="bi bi-trash"></i> Удалить</a>
                                </div>
                            </div>
                        </td>
                    </tr>`;
                }).join('');

                 // Обновляем количество столбцов в colspan
                 if(tableBody.parentNode.querySelector('tfoot')){
                   tableBody.parentNode.querySelector('tfoot td').setAttribute('colspan', '7');
                 }

            } else {
                tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Пользователи не найдены.</td></tr>`;
            }
            // --- КОНЕЦ ОБНОВЛЕНИЯ ---

            const script = document.createElement('script');
            script.src = '/static/js/users.js';
            script.onload = () => {
                if (window.initializeUsersPage) {
                    window.initializeUsersPage();
                }
            };
            document.body.appendChild(script);

        } catch (error) {
            console.error("Ошибка загрузки пользователей:", error);
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Не удалось загрузить список пользователей: ${error.message}</td></tr>`;
        }
    });
}

    // --- Функция для отображения ролей ---
    window.showRoles = async function() {
        pageTitle.innerText = "Роли";
        await loadContent('/static/html/roles.html', async () => {
            const tableBody = document.getElementById("rolesTableBody");
            try {
                const res = await fetch("/api/roles", { headers: { "Authorization": "Bearer " + token } });
                 if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || `Ошибка: ${res.status}`);
                }
                const roles = await res.json();
                if (roles && roles.length > 0) {
                     tableBody.innerHTML = roles.map(r => `
                     <tr data-id="${r.id}">
                        <td>${r.id}</td>
                        <td>${r.name}</td>
                        <td>${r.description || '—'}</td>
                        <td class="text-center">
                            <div class="action-dropdown">
                                <button class="action-button">Действия <i class="bi bi-chevron-down"></i></button>
                                <div class="action-dropdown-content">
                                    <a href="#" class="edit-role-btn" data-id="${r.id}"><i class="bi bi-pencil"></i> Изменить</a>
                                    <a href="#" class="delete-role-btn" data-id="${r.id}"><i class="bi bi-trash"></i> Удалить</a>
                                </div>
                            </div>
                        </td>
                     </tr>`).join('');
                } else {
                    tableBody.innerHTML = `<tr><td colspan="4" class="text-center">Роли не найдены.</td></tr>`;
                }

                const script = document.createElement('script');
                script.src = '/static/js/roles.js';
                script.onload = () => {
                    if (window.initializeRolesPage) {
                        window.initializeRolesPage();
                    }
                };
                document.body.appendChild(script);

            } catch (error) {
                console.error("Ошибка загрузки ролей:", error);
                tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Не удалось загрузить список ролей: ${error.message}</td></tr>`;
            }
        });
    }


    // ===============================================
    // 5. ЛОГИКА ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
    // ===============================================

    // --- Функция выхода ---
    function logout() {
        localStorage.removeItem('token');
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        window.location.href = '/';
    }

    // --- Открытие модального окна профиля ---
    profileLink?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Не удалось загрузить данные профиля.');

            document.getElementById('profile_fullName').value = data.fullName || '';
            document.getElementById('profile_iin').value = data.iin || '';
            document.getElementById('profile_email').value = data.email || '';
            phoneInput.value = data.phone || '';
            photoPreview.src = data.photoUrl || '/static/placeholder.png';

            editProfileModal.style.display = 'flex';
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    });

    // --- Закрытие модального окна ---
    const closeProfileModal = () => editProfileModal.style.display = 'none';
    closeProfileBtn?.addEventListener('click', closeProfileModal);
    cancelProfileBtn?.addEventListener('click', closeProfileModal);

    // --- Предпросмотр фото ---
    photoPreview?.addEventListener('click', () => photoInput.click());
    photoInput?.addEventListener('change', (event) => {
        if (event.target.files[0]) {
            photoPreview.src = URL.createObjectURL(event.target.files[0]);
        }
    });

    // --- ИСПРАВЛЕННЫЙ ОБРАБОТЧИК СОХРАНЕНИЯ ПРОФИЛЯ ---
    editProfileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(editProfileForm);

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error);

            alert(result.message);
            closeProfileModal();

            // *** КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ НАХОДИТСЯ ЗДЕСЬ ***
            if (result.user && result.user.photoUrl) {
                const newPhotoUrl = result.user.photoUrl;

                // Добавляем параметр к URL, чтобы сбросить кеш браузера
                const cacheBustedUrl = `${newPhotoUrl}?t=${new Date().getTime()}`;

                // Обновляем фото в шапке
                const headerPhoto = document.getElementById('userProfilePhoto');
                if (headerPhoto) {
                    headerPhoto.src = cacheBustedUrl;
                }

                // Обновляем фото в превью модального окна на будущее
                if(photoPreview) {
                    photoPreview.src = cacheBustedUrl;
                }
            }

        } catch (error) {
            console.error('Ошибка при сохранении профиля:', error);
            alert('Ошибка: ' + error.message);
        }
    });

    // --- Загрузка данных профиля при старте страницы ---
async function loadInitialProfileData() {
    try {
        const res = await fetch('/api/profile', { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (!res.ok) {
            console.error("Не удалось получить данные профиля, статус:", res.status);
            return;
        }

        const data = await res.json();
        
        const headerPhoto = document.getElementById('userProfilePhoto');
        if (headerPhoto && data.photoUrl) {
            headerPhoto.src = data.photoUrl;
        }

        const userEmailElement = document.getElementById("userEmail");
        if (userEmailElement && data.login) {
             userEmailElement.innerText = data.login;
        }

    } catch(e) {
        console.error("Ошибка при загрузке начальных данных профиля:", e);
    }
}


    // ===============================================
    // 6. ПРИВЯЗКА СОБЫТИЙ И ЗАПУСК
    // ===============================================
    document.getElementById("showStudents")?.addEventListener('click', (e) => { e.preventDefault(); window.loadStudentsPage(); });
    document.getElementById("showGrades")?.addEventListener('click', (e) => { e.preventDefault(); window.loadGradesPage(); });
    document.getElementById("showUsers")?.addEventListener('click', (e) => { e.preventDefault(); window.showUsers(); });
    document.getElementById("showRoles")?.addEventListener('click', (e) => { e.preventDefault(); window.showRoles(); });
    logoutBtn?.addEventListener('click', logout);

    // Начальная загрузка
    loadStudentsPage(); // Загружаем страницу учеников по умолчанию
    loadInitialProfileData(); // Загружаем данные пользователя для шапки

});
