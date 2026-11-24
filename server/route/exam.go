package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

func RouteExam(api *echo.Group) {
	api.GET("/exam-sessions/:id", controller.GetExamSession)
	api.GET("/exam-sessions/:id/summary", controller.GetExamSessionSummary)
	api.GET("/exam-sessions/:id/questions/:questionId", controller.GetExamSessionQuestionDetail)
	api.GET("/admin/exam-sessions", controller.GetAllExamSessions)
}
