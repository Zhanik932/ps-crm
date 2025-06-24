package config

import (
	"fmt"
	"log"
	"prometheus-crm/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := "host=localhost user=postgres password=Rasul2001! dbname=crm port=5432 sslmode=disable TimeZone=Asia/Almaty"

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Ошибка подключения к PostgreSQL:", err)
	}
	fmt.Println("Успешно подключено к PostgreSQL")
	DB.AutoMigrate(&models.User{})
}
