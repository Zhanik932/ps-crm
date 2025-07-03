package routes

import (
	"prometheus-crm/internal/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(r *gin.Engine) {
	// Маршруты для входа и выхода
	r.GET("/", handlers.ShowLoginPage)
	r.POST("/login", handlers.LoginHandler)
	r.GET("/logout", handlers.LogoutHandler)

	// Новые маршруты для регистрации
	r.GET("/register", handlers.ShowRegisterPage) // Показ страницы регистрации
	r.POST("/register", handlers.RegisterHandler) // Обработка данных с формы регистрации
}
