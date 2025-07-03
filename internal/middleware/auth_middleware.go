package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"prometheus-crm/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware проверяет наличие и валидность JWT токена.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr, err := c.Cookie("auth_token")
		if err != nil || tokenStr == "" {
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" {
				handleAuthError(c, "Authorization token not provided")
				return
			}
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				handleAuthError(c, "Invalid Authorization header format")
				return
			}
			tokenStr = parts[1]
		}

		if tokenStr == "" {
			handleAuthError(c, "Authorization token not provided")
			return
		}

		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return config.JwtKey, nil
		})

		if err != nil || !token.Valid {
			handleAuthError(c, "Invalid or expired token")
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			c.Set("user_id", claims["user_id"])
			c.Set("roles", claims["roles"])
			c.Set("login", claims["login"])
		} else {
			handleAuthError(c, "Invalid token claims")
			return
		}
		c.Next()
	}
}

// RoleMiddleware проверяет, имеет ли пользователь хотя бы одну из требуемых ролей.
func RoleMiddleware(requiredRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roles, exists := c.Get("roles")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "User roles not found in token"})
			c.Abort()
			return
		}

		userRoles, ok := roles.([]interface{})
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid roles format in token"})
			c.Abort()
			return
		}

		userRolesMap := make(map[string]bool)
		for _, role := range userRoles {
			if roleName, ok := role.(string); ok {
				userRolesMap[roleName] = true
			}
		}

		hasPermission := false
		for _, requiredRole := range requiredRoles {
			if userRolesMap[requiredRole] {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func handleAuthError(c *gin.Context, message string) {
	if strings.Contains(c.GetHeader("Accept"), "text/html") {
		c.Redirect(http.StatusFound, "/")
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": message})
	}
	c.Abort()
}
