package main

import (
	"prometheus-crm/config"
	"prometheus-crm/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	config.ConnectDB()

	r.LoadHTMLGlob("templates/*")

	r.GET("/register", func(c *gin.Context) {
		c.HTML(200, "register.html", nil)
	})
	r.GET("/login", func(c *gin.Context) {
		c.HTML(200, "login.html", nil)
	})
	r.GET("/users-ui", func(c *gin.Context) {
		c.HTML(200, "users.html", nil)
	})
	r.GET("/", func(c *gin.Context) {
		c.HTML(200, "index.html", nil)
	})
	r.GET("/dashboard", func(c *gin.Context) {
		c.HTML(200, "dashboard.html", nil)
	})
	routes.RoleRoutes(r)
	r.Static("/static", "./static")
	r.LoadHTMLGlob("templates/*")

	routes.UserRoutes(r)

	r.Run(":8080")
}
