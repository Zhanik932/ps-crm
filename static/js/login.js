// Эта функция гарантирует, что наш код начнет выполняться только после того,
// как вся HTML-структура страницы будет загружена.
document.addEventListener('DOMContentLoaded', function() {

  // Находим наши элементы в DOM один раз, чтобы не искать их постоянно
  const loginForm = document.getElementById('loginForm');
  // ИЗМЕНЕНО: Ищем поле по id="login"
  const loginInput = document.getElementById('login');
  const passwordInput = document.getElementById('password');
  const errorDiv = document.getElementById('loginError');

  // Проверяем, что все нужные элементы существуют на странице
  if (!loginForm || !loginInput || !passwordInput || !errorDiv) {
    console.error('Не найдены все необходимые элементы для формы входа.');
    return; // Прекращаем выполнение, если что-то пошло не так
  }

  // Назначаем функцию, которая будет выполняться при отправке формы
  loginForm.onsubmit = async function(e) {
    // Предотвращаем стандартное поведение формы (перезагрузку страницы)
    e.preventDefault();

    // Прячем старое сообщение об ошибке при новой попытке входа
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    // Получаем и очищаем значения из полей ввода
    // ИЗМЕНЕНО: Используем loginInput
    const login = loginInput.value.trim();
    const password = passwordInput.value;

    // Простая проверка на клиенте, что поля не пустые
    if (!login || !password) {
      errorDiv.textContent = 'Пожалуйста, заполните все поля.';
      errorDiv.style.display = 'block';
      return;
    }

    try {
      // Отправляем асинхронный запрос на сервер
      const res = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // ИЗМЕНЕНО: Отправляем объект с полем "login"
        body: JSON.stringify({ login, password })
      });

      const data = await res.json();

      // Проверяем, успешен ли ответ сервера (статус 200-299)
      if (res.ok) {
        // Сохраняем токен для последующих запросов
        localStorage.setItem('token', data.token);
        
        // Перенаправляем пользователя на главную панель
        window.location.href = '/dashboard';

      } else {
        // Если сервер ответил ошибкой (например, 401 Unauthorized)
        errorDiv.textContent = data.error || 'Неверный логин или пароль.';
        errorDiv.style.display = 'block'; // Показываем блок с ошибкой
      }

    } catch (err) {
      // Если произошла ошибка сети (сервер недоступен и т.д.)
      console.error('Ошибка при отправке запроса:', err);
      errorDiv.textContent = 'Произошла ошибка сети. Попробуйте позже.';
      errorDiv.style.display = 'block';
    }
  };

  // Дополнительное улучшение: скрывать ошибку, как только пользователь начинает вводить новый пароль или логин
  loginInput.oninput = () => errorDiv.style.display = 'none';
  passwordInput.oninput = () => errorDiv.style.display = 'none';

});
