package handlers

import (
	"net/http"
	"prometheus-crm/config"
	"prometheus-crm/models"

	"github.com/gin-gonic/gin"
)

// ListRolesHandler возвращает список всех ролей из базы данных.
func ListRolesHandler(c *gin.Context) {
	var roles []models.Role
	if err := config.DB.Order("id asc").Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch roles"})
		return
	}
	if roles == nil {
		roles = make([]models.Role, 0)
	}
	c.JSON(http.StatusOK, roles)
}

// ИСПРАВЛЕНО: Добавлен обработчик для получения одной роли.
// GetRoleHandler получает данные одной роли по ID.
func GetRoleHandler(c *gin.Context) {
	id := c.Param("id")
	var role models.Role
	if err := config.DB.First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}
	c.JSON(http.StatusOK, role)
}

// RoleInput определяет структуру для создания/обновления роли.
type RoleInput struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

// CreateRoleHandler создает новую роль.
func CreateRoleHandler(c *gin.Context) {
	var input RoleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := models.Role{
		Name:        input.Name,
		Description: input.Description,
	}

	if err := config.DB.Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create role"})
		return
	}

	c.JSON(http.StatusCreated, role)
}

// UpdateRoleHandler обновляет существующую роль.
func UpdateRoleHandler(c *gin.Context) {
	id := c.Param("id")
	var role models.Role
	if err := config.DB.First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}

	var input RoleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role.Name = input.Name
	role.Description = input.Description

	if err := config.DB.Save(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
		return
	}

	c.JSON(http.StatusOK, role)
}

// DeleteRoleHandler удаляет роль.
func DeleteRoleHandler(c *gin.Context) {
	id := c.Param("id")

	// Проверяем, не назначена ли эта роль какому-либо пользователю
	var count int64
	config.DB.Table("user_roles").Where("role_id = ?", id).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Cannot delete role: it is assigned to one or more users"})
		return
	}

	if result := config.DB.Delete(&models.Role{}, id); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete role"})
		return
	} else if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role deleted successfully"})
}
