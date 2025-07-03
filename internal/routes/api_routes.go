package routes

import (
	"prometheus-crm/internal/handlers"
	"prometheus-crm/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterAPIRoutes(r *gin.Engine) {
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware()) // Все API-маршруты требуют аутентификации
	{
		// --- Администрирование (только для админов) ---
		adminGroup := api.Group("/")
		adminGroup.Use(middleware.RoleMiddleware("admin")) // Требуется роль "admin"
		{
			// Управление пользователями
			adminGroup.GET("/users", handlers.ListUsersHandler)
			adminGroup.POST("/users", handlers.CreateUserHandler)
			adminGroup.GET("/users/:id", handlers.GetUserHandler)
			adminGroup.PUT("/users/:id", handlers.UpdateUserHandler)
			adminGroup.DELETE("/users/:id", handlers.DeleteUserHandler)

			// Управление ролями
			adminGroup.GET("/roles", handlers.ListRolesHandler)
			adminGroup.POST("/roles", handlers.CreateRoleHandler)
			adminGroup.GET("/roles/:id", handlers.GetRoleHandler) // ИСПРАВЛЕНО: Добавлен маршрут
			adminGroup.PUT("/roles/:id", handlers.UpdateRoleHandler)
			adminGroup.DELETE("/roles/:id", handlers.DeleteRoleHandler)
		}

		// --- Ученики и классы (доступно для других ролей, например, 'manager', 'teacher') ---
		api.GET("/students", handlers.ListStudentsHandler)
		api.POST("/students", handlers.CreateStudentHandler)
		api.GET("/students/:id", handlers.GetStudentHandler)
		api.PUT("/students/:id", handlers.UpdateStudentHandler)
		api.DELETE("/students/:id", handlers.DeleteStudentHandler)

		api.GET("/classes", handlers.ListClassesHandler)
		api.POST("/classes", handlers.CreateClassHandler)
		api.GET("/classes/:id", handlers.GetClassHandler)
		api.PUT("/classes/:id", handlers.UpdateClassHandler)
		api.DELETE("/classes/:id", handlers.DeleteClassHandler)
		api.PUT("/profile", handlers.UpdateProfileHandler)
		api.GET("/profile", handlers.GetProfileHandler)
	}
}
