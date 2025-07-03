package handlers

import (
	"fmt"
	"net/http"
	"prometheus-crm/config"
	"prometheus-crm/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ListClassesHandler (без изменений, но включен для полноты)
func ListClassesHandler(c *gin.Context) {
	var classes []models.ClassResponse
	query := `
    SELECT
        c.id, c.grade_number, COALESCE(cl.liter_char, '?') as liter_char, c.language, c.study_type,
        COALESCE(u.name, 'Не назначен') as teacher_name,
        (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) as student_count
    FROM classes c
    LEFT JOIN class_liters cl ON c.liter_id = cl.id
    LEFT JOIN users u ON c.teacher_id = u.id
    ORDER BY c.grade_number, cl.liter_char;
`
	if err := config.DB.Raw(query).Scan(&classes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении данных о классах: " + err.Error()})
		return
	}
	if classes == nil {
		classes = make([]models.ClassResponse, 0)
	}
	c.JSON(http.StatusOK, classes)
}

// CreateClassHandler для создания нового класса
func CreateClassHandler(c *gin.Context) {
	var input models.ClassInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные: " + err.Error()})
		return
	}

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var liter models.ClassLiter
		// Находим или создаем запись в таблице class_liters
		if err := tx.Where(models.ClassLiter{LiterChar: input.LiterChar}).FirstOrCreate(&liter).Error; err != nil {
			return err
		}

		// Создаем новый класс, используя ID литера
		newClass := models.Class{
			GradeNumber: input.GradeNumber,
			LiterID:     int(liter.ID), // Приводим тип к int
			TeacherID:   input.TeacherID,
			Language:    input.Language,
			StudyType:   input.StudyType,
		}

		if err := tx.Create(&newClass).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать класс: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Класс успешно создан"})
}

// GetClassHandler для получения одного класса по ID
func GetClassHandler(c *gin.Context) {
	id := c.Param("id")
	var classResponse models.ClassResponse

	query := `
        SELECT
            c.id, c.grade_number, cl.liter_char, c.language, c.study_type,
            COALESCE(u.name, 'Не назначен') as teacher_name
        FROM classes c
        JOIN class_liters cl ON c.liter_id = cl.id
        LEFT JOIN users u ON c.teacher_id = u.id
        WHERE c.id = ?
    `
	if err := config.DB.Raw(query, id).First(&classResponse).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Класс не найден"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении класса"})
		return
	}
	c.JSON(http.StatusOK, classResponse)
}

// UpdateClassHandler для обновления класса
func UpdateClassHandler(c *gin.Context) {
	id := c.Param("id")
	var input models.ClassInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные: " + err.Error()})
		return
	}

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var liter models.ClassLiter
		if err := tx.Where(models.ClassLiter{LiterChar: input.LiterChar}).FirstOrCreate(&liter).Error; err != nil {
			return err
		}

		classToUpdate := models.Class{
			GradeNumber: input.GradeNumber,
			LiterID:     int(liter.ID),
			TeacherID:   input.TeacherID,
			Language:    input.Language,
			StudyType:   input.StudyType,
		}

		if result := tx.Model(&models.Class{}).Where("id = ?", id).Updates(classToUpdate); result.Error != nil {
			return result.Error
		} else if result.RowsAffected == 0 {
			return fmt.Errorf("класс с ID %s не найден", id)
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить класс: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Класс успешно обновлен"})
}

// DeleteClassHandler для удаления класса
func DeleteClassHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный ID"})
		return
	}

	var studentCount int64
	config.DB.Model(&models.Student{}).Where("class_id = ?", id).Count(&studentCount)
	if studentCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("Нельзя удалить класс, в нем есть %d учеников.", studentCount)})
		return
	}

	if result := config.DB.Delete(&models.Class{}, id); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось удалить класс"})
		return
	} else if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Класс не найден"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Класс успешно удален"})
}
