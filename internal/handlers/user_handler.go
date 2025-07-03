package handlers

import (
	"net/http"
	"prometheus-crm/config"
	"prometheus-crm/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// UserResponse defines the structure for user data sent in API responses.
// This helps prevent accidental leakage of sensitive data like password hashes.
type UserResponse struct {
	ID        uint      `json:"id"`
	Login     string    `json:"login"`
	Email     string    `json:"email"`
	FullName  string    `json:"fullName"`
	Phone     string    `json:"phone"`
	Status    string    `json:"status"`
	Roles     []string  `json:"roles"`
	CreatedAt time.Time `json:"createdAt"`
	PhotoURL  string    `json:"photoUrl"`
}

// ListUsersHandler returns a list of all users with their roles.
func ListUsersHandler(c *gin.Context) {
	var users []models.User
	// Preload associated roles to avoid N+1 queries
	if err := config.DB.Preload("Roles").Order("id asc").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch users"})
		return
	}

	// Create a custom response
	var response []UserResponse
	for _, user := range users {
		var roleNames []string
		for _, role := range user.Roles {
			roleNames = append(roleNames, role.Name)
		}
		photoUrl := user.PhotoURL
		if photoUrl == "" {
			photoUrl = "/static/placeholder.png" // Устанавливаем фото по умолчанию
		}
		response = append(response, UserResponse{
			ID:        user.ID,
			Login:     user.Login,
			Email:     user.Email,
			FullName:  user.FullName,
			Phone:     user.Phone,
			Status:    user.Status,
			Roles:     roleNames,
			CreatedAt: user.CreatedAt,
			PhotoURL:  photoUrl,
		})
	}
	if response == nil {
		response = make([]UserResponse, 0)
	}

	c.JSON(http.StatusOK, response)
}

// CreateUserInput defines the structure for creating a user from the admin panel.
type CreateUserInput struct {
	Login    string `json:"login" binding:"required"`
	FullName string `json:"fullName" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password"` // Password is not required, can be set later
	Phone    string `json:"phone"`
	Status   string `json:"status" binding:"required"`
	RoleIDs  []uint `json:"roleIds"` // IDs of roles to assign
}

// UpdateUserInput defines the structure for updating a user.
type UpdateUserInput struct {
	FullName string `json:"fullName" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Phone    string `json:"phone"`
	Status   string `json:"status" binding:"required"`
	RoleIDs  []uint `json:"roleIds"`
	Password string `json:"password"` // For changing the password
}

// GetUserHandler retrieves a single user by ID.
func GetUserHandler(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.Preload("Roles").First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if user.PhotoURL == "" {
		user.PhotoURL = "/static/placeholder.png"
	}

	c.JSON(http.StatusOK, user)
}

// CreateUserHandler creates a new user.
func CreateUserHandler(c *gin.Context) {
	var input CreateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := models.User{
		Login:    input.Login,
		FullName: input.FullName,
		Email:    input.Email,
		Phone:    input.Phone,
		Status:   input.Status,
	}

	if input.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		user.Password = string(hashedPassword)
	}

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}

		if len(input.RoleIDs) > 0 {
			var roles []models.Role
			if err := tx.Where("id IN ?", input.RoleIDs).Find(&roles).Error; err != nil {
				return err
			}
			if err := tx.Model(&user).Association("Roles").Replace(roles); err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, user)
}

// UpdateUserHandler updates a user's data.
func UpdateUserHandler(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var input UpdateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user.FullName = input.FullName
	user.Email = input.Email
	user.Phone = input.Phone
	user.Status = input.Status

	if input.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		user.Password = string(hashedPassword)
	}

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&user).Error; err != nil {
			return err
		}

		var roles []models.Role
		if len(input.RoleIDs) > 0 {
			if err := tx.Where("id IN ?", input.RoleIDs).Find(&roles).Error; err != nil {
				return err
			}
		}
		// Replace completely overwrites the current roles with the new set
		if err := tx.Model(&user).Association("Roles").Replace(roles); err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

// DeleteUserHandler soft-deletes a user.
func DeleteUserHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if result := config.DB.Delete(&models.User{}, id); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}
