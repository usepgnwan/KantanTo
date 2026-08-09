package controller

import (
	"fmt"
	"net/http"
	"strings"

	"server/app/model"
	"server/connection"

	"github.com/labstack/echo/v4"
)

func GenerateSitemap(c echo.Context) error {
	baseUrl := "https://tryout.rifayaeducation.com"
	
	// Static routes
	paths := []string{
		"/",
		"/login",
		"/register",
		"/forgot-password",
		"/paket",
		"/keranjang",
		"/checkout",
		"/profile",
		"/pembelian",
		"/dashboard",
		"/riwayat",
		"/latihan",
		"/blog",
		"/kontak",
	}

	// Dynamic Packages
	var packages []model.Package
	connection.DB.Where("status != ?", "draft").Find(&packages)
	for _, pkg := range packages {
		if pkg.Slug != "" {
			paths = append(paths, "/paket/"+pkg.Slug)
		}
	}

	// Dynamic Blogs/Articles
	var artikels []model.Artikel
	connection.DB.Where("status != ?", "draft").Find(&artikels)
	for _, art := range artikels {
		if art.Slug != "" {
			paths = append(paths, "/blog/"+art.Slug)
		}
	}

	xmlLines := []string{
		`<?xml version="1.0" encoding="UTF-8"?>`,
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
	}

	for _, p := range paths {
		priority := "0.8"
		if p == "/" {
			priority = "1.0"
		}
		
		xmlLines = append(xmlLines, fmt.Sprintf(`  <url>
    <loc>%s%s</loc>
    <changefreq>weekly</changefreq>
    <priority>%s</priority>
  </url>`, baseUrl, p, priority))
	}

	xmlLines = append(xmlLines, `</urlset>`)
	xmlOutput := strings.Join(xmlLines, "\n")

	return c.Blob(http.StatusOK, "application/xml", []byte(xmlOutput))
}
