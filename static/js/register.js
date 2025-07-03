document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const errorDiv = document.getElementById('registerError');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (!registerForm || !errorDiv || !passwordInput || !confirmPasswordInput) {
        console.error('Не найдены все необходимые элементы для формы регистрации.');
        return;
    }

    registerForm.onsubmit = async function(e) {
        e.preventDefault();
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Проверка на совпадение паролей
        if (password !== confirmPassword) {
            errorDiv.textContent = 'Пароли не совпадают.';
            errorDiv.style.display = 'block';
            return;
        }
        
        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());
        // Удаляем поле подтверждения пароля перед отправкой
        delete data.confirmPassword;

        try {
            const res = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const responseData = await res.json();

            if (res.ok) {
                alert('Регистрация прошла успешно! Теперь вы можете войти.');
                window.location.href = '/'; // Перенаправляем на страницу входа
            } else {
                // Улучшенное сообщение об ошибке
                let errorMessage = 'Произошла ошибка при регистрации.';
                if (responseData && responseData.error) {
                   if (responseData.error.includes("Login or Email already in use")) {
                       errorMessage = "Пользователь с таким логином или email уже существует.";
                   } else {
                       errorMessage = responseData.error;
                   }
                }
                errorDiv.textContent = errorMessage;
                errorDiv.style.display = 'block';
            }

        } catch (err) {
            console.error('Ошибка при отправке запроса:', err);
            errorDiv.textContent = 'Произошла ошибка сети. Попробуйте позже.';
            errorDiv.style.display = 'block';
        }
    };
});
