package controller

import (
	"fmt"
	"net/http"
	"strings"

	"server/app/model"
	"server/connection"

	"github.com/labstack/echo/v4"
)

const baseUrl = "https://tryout.rifayaeducation.com"

func GenerateSitemapIndex(c echo.Context) error {
	xmlLines := []string{
		`<?xml version="1.0" encoding="UTF-8"?>`,
		`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
	}
	sitemaps := []string{
		"/page-sitemap.xml",
		"/package-sitemap.xml",
		"/blog-sitemap.xml",
	}
	for _, sm := range sitemaps {
		xmlLines = append(xmlLines, fmt.Sprintf(`  <sitemap>
    <loc>%s%s</loc>
  </sitemap>`, baseUrl, sm))
	}
	xmlLines = append(xmlLines, `</sitemapindex>`)
	return c.Blob(http.StatusOK, "application/xml", []byte(strings.Join(xmlLines, "\n")))
}

func GeneratePageSitemap(c echo.Context) error {
	paths := []string{
		"/",
		"/paket",
		"/blog",
		"/kontak",
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
	return c.Blob(http.StatusOK, "application/xml", []byte(strings.Join(xmlLines, "\n")))
}

func GeneratePackageSitemap(c echo.Context) error {
	var packages []model.Package
	connection.DB.Where("status != ?", "draft").Find(&packages)

	xmlLines := []string{
		`<?xml version="1.0" encoding="UTF-8"?>`,
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
	}

	for _, pkg := range packages {
		if pkg.Slug != "" {
			xmlLines = append(xmlLines, fmt.Sprintf(`  <url>
    <loc>%s/paket/%s</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`, baseUrl, pkg.Slug))
		}
	}

	xmlLines = append(xmlLines, `</urlset>`)
	return c.Blob(http.StatusOK, "application/xml", []byte(strings.Join(xmlLines, "\n")))
}

func GenerateBlogSitemap(c echo.Context) error {
	var artikels []model.Artikel
	connection.DB.Where("status != ?", "draft").Find(&artikels)

	xmlLines := []string{
		`<?xml version="1.0" encoding="UTF-8"?>`,
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
	}

	for _, art := range artikels {
		if art.Slug != "" {
			xmlLines = append(xmlLines, fmt.Sprintf(`  <url>
    <loc>%s/blog/%s</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`, baseUrl, art.Slug))
		}
	}

	xmlLines = append(xmlLines, `</urlset>`)
	return c.Blob(http.StatusOK, "application/xml", []byte(strings.Join(xmlLines, "\n")))
}
