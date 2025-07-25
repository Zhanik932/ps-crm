package routes

import (
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	RegisterAuthRoutes(r)
	RegisterDashboardRoutes(r)
	RegisterAPIRoutes(r)
}
