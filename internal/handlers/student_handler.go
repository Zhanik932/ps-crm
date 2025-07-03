package handlers

import (
	"net/http"
	"prometheus-crm/config"
	"prometheus-crm/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ИСПРАВЛЕНО: Создана специальная структура для более чистого ответа API
type StudentListResponse struct {
	ID           uint    `json:"ID"`
	LastName     string  `json:"lastName"`
	FirstName    string  `json:"firstName"`
	MiddleName   string  `json:"middleName"`
	IsStudying   bool    `json:"isStudying"`
	Grade        *int    `json:"grade"` // Номер класса
	Liter        *string `json:"liter"` // Литер класса
	StudentPhone string  `json:"studentPhone"`
}

// ListStudentsHandler возвращает отфильтрованный список учеников.
func ListStudentsHandler(c *gin.Context) {
	var students []StudentListResponse

	query := config.DB.Table("students").
		Select(`
            students.id,
            students.last_name,
            students.first_name,
            students.middle_name,
            students.is_studying,
            students.student_phone,
            classes.grade_number as grade,
            class_liters.liter_char as liter
        `).
		Joins("LEFT JOIN classes ON students.class_id = classes.id").
		Joins("LEFT JOIN class_liters ON classes.liter_id = class_liters.id")

	if err := query.Order("students.id asc").Scan(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось загрузить учеников: " + err.Error()})
		return
	}

	if students == nil {
		students = make([]StudentListResponse, 0)
	}

	c.JSON(http.StatusOK, students)
}

// CreateStudentHandler (без изменений)
func CreateStudentHandler(c *gin.Context) {
	var newStudent models.Student
	if err := c.ShouldBindJSON(&newStudent); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных: " + err.Error()})
		return
	}

	if result := config.DB.Create(&newStudent); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось сохранить ученика: " + result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, newStudent)
}

// --- ДОБАВЬТЕ ЭТИ НОВЫЕ ФУНКЦИИ ---

// GetStudentHandler для получения одного ученика
func GetStudentHandler(c *gin.Context) {
	id := c.Param("id")
	var student models.Student
	if err := config.DB.First(&student, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Ученик не найден"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения данных ученика"})
		return
	}
	c.JSON(http.StatusOK, student)
}

// UpdateStudentHandler для обновления ученика
func UpdateStudentHandler(c *gin.Context) {
	id := c.Param("id")
	var student models.Student
	if err := config.DB.First(&student, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ученик не найден"})
		return
	}

	if err := c.ShouldBindJSON(&student); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат данных: " + err.Error()})
		return
	}

	config.DB.Save(&student)
	c.JSON(http.StatusOK, student)
}

// DeleteStudentHandler для удаления ученика
func DeleteStudentHandler(c *gin.Context) {
	id := c.Param("id")
	if result := config.DB.Delete(&models.Student{}, id); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось удалить ученика"})
		return
	} else if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ученик не найден"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ученик успешно удален"})
}
