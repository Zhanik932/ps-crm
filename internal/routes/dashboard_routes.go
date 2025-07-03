package routes

import (
	"prometheus-crm/internal/handlers"
	"prometheus-crm/internal/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterDashboardRoutes(r *gin.Engine) {
	r.GET("/dashboard", middleware.AuthMiddleware(), handlers.DashboardHandler)

}
