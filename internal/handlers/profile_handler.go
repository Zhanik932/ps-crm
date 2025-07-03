// internal/handlers/profile_handler.go

package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"prometheus-crm/config"
	"prometheus-crm/models"
	"time"

	"github.com/gin-gonic/gin"
)

// GetProfileHandler возвращает данные текущего авторизованного пользователя.
func GetProfileHandler(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		return
	}

	// Отправляем только публичные данные
	c.JSON(http.StatusOK, gin.H{
		"id":       user.ID,
		"login":    user.Login,
		"email":    user.Email,
		"phone":    user.Phone,
		"fullName": user.FullName,
		"photoUrl": user.PhotoURL,
		"iin":      user.IIN,
	})
}

// UpdateProfileHandler обновляет данные профиля пользователя
func UpdateProfileHandler(c *gin.Context) {
	userID, _ := c.Get("user_id")
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Пользователь не найден"})
		return
	}

	// Обработка текстовых полей
	user.FullName = c.PostForm("fullName")
	user.IIN = c.PostForm("iin")
	user.Email = c.PostForm("email")
	user.Phone = c.PostForm("phone")

	// Обработка загрузки файла (фотографии)
	file, err := c.FormFile("photo")
	if err == nil {
		uploadDir := "../../static/uploads/users"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			os.MkdirAll(uploadDir, os.ModePerm)
		}

		// ВАЖНО: Создаем безопасное имя файла, чтобы избежать проблем с путем.
		// Используем ID пользователя и временную метку для уникальности.
		ext := filepath.Ext(file.Filename)
		newFileName := fmt.Sprintf("%d_%d%s", user.ID, time.Now().Unix(), ext)
		filePath := filepath.Join(uploadDir, newFileName)

		if err := c.SaveUploadedFile(file, filePath); err == nil {
			// ВАЖНО: Используем filepath.ToSlash для URL-совместимости на всех ОС
			user.PhotoURL = "/" + filepath.ToSlash(filePath)
		} else {
			// Если не удалось сохранить файл, возвращаем ошибку
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сохранить файл на сервере"})
			return
		}
	}

	if err := config.DB.Save(&user).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить профиль в базе данных"})
		return
	}

	// Возвращаем успешный ответ с новым URL фото
	c.JSON(http.StatusOK, gin.H{
		"message": "Профиль успешно обновлен",
		"user": gin.H{
			"photoUrl": user.PhotoURL,
		},
	})
}
