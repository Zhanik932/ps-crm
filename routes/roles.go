package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Role struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

func RoleRoutes(r *gin.Engine) {
	r.GET("/roles", func(c *gin.Context) {
		roles := []Role{
			{ID: 1, Name: "admin"},
			{ID: 2, Name: "manager"},
			{ID: 3, Name: "teacher"},
		}
		c.JSON(http.StatusOK, roles)
	})
}
