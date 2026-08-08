package controller

import (
	"net/http"
	. "server/app/helpers"
	"server/app/model"
	"server/connection"
	"strconv"

	"github.com/labstack/echo/v4"
)

// GetExampleExams godoc
// @Summary      Get all Example Exams (Paginated)
// @Description  Get a paginated list of Example Exams
// @Tags         ExampleExam
// @Accept       json
// @Produce      json
// @Param        page    query     int     false  "Page number" default(1)
// @Param        limit   query     int     false  "Limit per page" default(10)
// @Param        question query     string  false  "Search by question"
// @Security     ApiKeyAuth
// @Success      200  {object}  Response{data=helpers.ResponsePaginate}
// @Failure      500  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/example-exam [get]
func GetExampleExams(c echo.Context) error {
	data := &Paginate{
		Model: &model.ExampleExam{},
	}
	db := connection.DB
	query := db.Model(&model.ExampleExam{})

	q := c.QueryParam("question")
	if q != "" {
		query = query.Where("question ILIKE ?", "%"+q+"%")
	}

	result := data.Paginate(query, c)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success get data", Data: result})
}

// GetRandomExampleExam godoc
// @Summary      Get 1 Random Example Exam
// @Description  Get 1 random Example Exam for landing page
// @Tags         ExampleExam
// @Accept       json
// @Produce      json
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/example-exam/random [get]
func GetRandomExampleExam(c echo.Context) error {
	var exampleExam model.ExampleExam
	if err := connection.DB.Order("RANDOM()").First(&exampleExam).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Data tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success", Data: exampleExam})
}

// CreateExampleExam godoc
// @Summary      Create new Example Exam
// @Description  Create a new example exam
// @Tags         ExampleExam
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        request body model.ExampleExam true "ExampleExam Payload"
// @Success      200  {object}  Response
// @Failure      400  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/example-exam [post]
func CreateExampleExam(c echo.Context) error {
	exampleExam := new(model.ExampleExam)
	if err := c.Bind(exampleExam); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: err.Error()})
	}
	if err := connection.DB.Create(&exampleExam).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan data"})
	}
	return c.JSON(http.StatusCreated, Response{Status: true, Message: "Created successfully", Data: exampleExam})
}

// UpdateExampleExam godoc
// @Summary      Update Example Exam
// @Description  Update Example Exam by ID
// @Tags         ExampleExam
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Example Exam ID"
// @Param        request body model.ExampleExam true "ExampleExam Payload"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/example-exam/{id} [put]
func UpdateExampleExam(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	var exampleExam model.ExampleExam
	if err := connection.DB.First(&exampleExam, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Data tidak ditemukan"})
	}
	if err := c.Bind(&exampleExam); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: err.Error()})
	}
	connection.DB.Save(&exampleExam)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Updated successfully", Data: exampleExam})
}

// DeleteExampleExam godoc
// @Summary      Delete Example Exam
// @Description  Delete Example Exam by ID
// @Tags         ExampleExam
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Example Exam ID"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/example-exam/{id} [delete]
func DeleteExampleExam(c echo.Context) error {
	id := c.Param("id")
	if err := connection.DB.Delete(&model.ExampleExam{}, id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menghapus data"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Deleted successfully"})
}
