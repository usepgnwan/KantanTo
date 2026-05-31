package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

func RoutePackage(api *echo.Group) {
	packages := api.Group("/packages")
	packages.GET("", controller.GetPackages)
	packages.POST("", controller.CreatePackage)
	packages.PUT("/:slug", controller.UpdatePackage)
	packages.DELETE("/:slug", controller.DeletePackage)
	packages.GET("/:slug/questions", controller.GetPackageQuestions)
	packages.POST("/:slug/questions", controller.SavePackageQuestion)
	packages.PUT("/:slug/questions", controller.SavePackageQuestions)
	packages.GET("/:slug/materials", controller.GetPackageMaterials)
	packages.POST("/:slug/materials", controller.SavePackageMaterial)
	packages.PUT("/:slug/materials", controller.SavePackageMaterials)
	packages.DELETE("/:slug/materials/:id", controller.DeletePackageMaterial)
	packages.GET("/:slug/videos", controller.GetPackageVideos)
	packages.POST("/:slug/videos", controller.SavePackageVideo)
	packages.PUT("/:slug/videos", controller.SavePackageVideos)
	packages.DELETE("/:slug/videos/:id", controller.DeletePackageVideo)
	packages.POST("/score", controller.ScoreQuestion)
	
	// Exam Submit
	packages.POST("/:slug/submit", controller.SubmitExam)
}

