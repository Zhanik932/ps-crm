package models

// НОВАЯ СТРУКТУРА: Class представляет таблицу 'classes' в базе данных.
// Это основная GORM-модель.
type Class struct {
	ID          uint   `gorm:"primaryKey"`
	GradeNumber int    `gorm:"not null"`
	LiterID     int    `gorm:"not null"`
	TeacherID   *int   // Указатель, так как может быть null
	Language    string `gorm:"size:50"`
	StudyType   string `gorm:"size:50"`
}

// НОВАЯ СТРУКТУРА: ClassLiter представляет таблицу 'class_liters'.
type ClassLiter struct {
	ID        uint   `gorm:"primaryKey"`
	LiterChar string `gorm:"size:3;unique;not null"`
}

// ClassResponse - это структура для ответа API, содержащая всю необходимую информацию о классе.
type ClassResponse struct {
	ID           uint   `json:"id"`
	GradeNumber  int    `json:"grade_number"`
	LiterChar    string `json:"liter_char"`
	StudentCount int    `json:"student_count"`
	TeacherName  string `json:"teacher_name"`
	Language     string `json:"language"`
	StudyType    string `json:"study_type"`
}

// ClassInput используется для привязки данных из JSON-запроса
// при создании или обновлении класса.
type ClassInput struct {
	GradeNumber int    `json:"grade_number" binding:"required,min=0,max=11"`
	LiterChar   string `json:"liter_char" binding:"required"`
	TeacherID   *int   `json:"teacher_id"`
	Language    string `json:"language"`
	StudyType   string `json:"study_type"`
}
