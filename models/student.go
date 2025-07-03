// prometheus-crm/models/student.go

package models

import (
	"time"

	"gorm.io/gorm"
)

// Student представляет модель ученика в базе данных
type Student struct {
	gorm.Model

	ClassID *uint `json:"classId"` // Указатель, чтобы значение могло быть null
	// --- ВКЛАДКА "ОСНОВНАЯ ИНФОРМАЦИЯ" ---
	IsStudying    *bool      `json:"isStudying" gorm:"default:true"`
	LastName      string     `json:"lastName" gorm:"not null"`
	FirstName     string     `json:"firstName" gorm:"not null"`
	MiddleName    string     `json:"middleName"`
	IIN           string     `json:"iin" gorm:"unique"`
	Gender        string     `json:"gender"`
	BirthDate     *time.Time `json:"birthDate"`
	StudentPhone  string     `json:"studentPhone"`
	Email         string     `json:"email"`
	StartDate     *time.Time `json:"startDate"`
	EndDate       *time.Time `json:"endDate"`
	MothersName   string     `json:"mothersName"`
	MothersPhone  string     `json:"mothersPhone"`
	FathersName   string     `json:"fathersName"`
	FathersPhone  string     `json:"fathersPhone"`
	RelativesInfo string     `json:"relativesInfo"`
	Comments      string     `json:"comments"`
	CourseID      *uint      `json:"courseId"`
	GradeID       *uint      `json:"gradeId"`
	GroupID       *uint      `json:"groupId"`

	// --- ВКЛАДКА "ИНФОРМАЦИЯ ДЛЯ ДОГОВОРА" ---
	ContractParentName           string     `json:"contractParentName"`
	ContractParentIIN            string     `json:"contractParentIIN"`
	ContractParentBirthDate      *time.Time `json:"contractParentBirthDate"`
	ContractParentEmail          string     `json:"contractParentEmail"`
	ContractParentPhone          string     `json:"contractParentPhone"`
	ContractParentDocumentNumber string     `json:"contractParentDocumentNumber"`
	ContractParentDocumentInfo   string     `json:"contractParentDocumentInfo"`

	// --- ВКЛАДКА "ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ" ---
	IsResident                *bool  `json:"isResident" gorm:"default:true"` // Поле "Резидент" вернулось
	BirthCertificateNumber    string `json:"birthCertificateNumber"`
	BirthCertificateIssueInfo string `json:"birthCertificateIssueInfo"`
	MothersWorkPlace          string `json:"mothersWorkPlace"`
	FathersWorkPlace          string `json:"fathersWorkPlace"`
	MothersJobTitle           string `json:"mothersJobTitle"`
	FathersJobTitle           string `json:"fathersJobTitle"`
	HomeAddress               string `json:"homeAddress"`
	MedicalInfo               string `json:"medicalInfo"`
	ShuttleRouteID            *uint  `json:"shuttleRouteId"`
	ClinicID                  *uint  `json:"clinicId"`
	NationalityID             *uint  `json:"nationalityId"`
	PreviousSchoolID          *uint  `json:"previousSchoolId"`
}
